/**
 * ListView.jsx
 *
 * The screen for viewing and editing one list: a toolbar carrying undo, redo,
 * the list's name and a close button, and beneath it a scrollable container of
 * item cards that can be reordered by dragging.
 *
 * Like HW1's ListView, this component changes nothing itself. Dragging a card
 * does not move anything; it calls moveItem, which asks the context for a new
 * list, which React then draws.
 *
 * THE DRAG AND DROP ARITHMETIC IS THE SAME, AND STILL THE EASY THING TO GET WRONG
 * ------------------------------------------------------------------------------
 * Say the user drags the card at index 1 and drops it below the card at index 4.
 * The insertion point among the cards currently on screen is 5, but the model
 * pulls the dragged card out first, which shifts everything after it down by
 * one, so the correct destination is 4. That adjustment is at the bottom of
 * computeDropTarget, and it is the single thing most worth a test.
 *
 * WHY THE DRAG STATE IS IN useState AND NOT A REF
 * ----------------------------------------------
 * Because the screen draws it. The red line showing where a card will land is
 * the whole point of a drop indicator, so where the card would land has to be
 * something React re-renders for.
 */
import { useEffect, useRef, useState } from 'react';
import { useListEditor } from '../hooks/useListEditor.js';
import { useUndoRedoShortcuts } from '../hooks/useUndoRedoShortcuts.js';
import { useLists } from '../context/ListsContext.jsx';
import Fab from './Fab.jsx';  
import ItemCard from './ItemCard.jsx';

export default function ListView() {
    const { list, canUndo, canRedo, undo, redo, closeList, moveItem, renameList, requestAddItem, requestEditItem, duplicateItem, requestDeleteItem } = useListEditor();

    const { listNeedingNameFocus, clearNameFocusRequest } = useLists();

    useUndoRedoShortcuts(undo, redo);

    // what the user is dragging, and where it would land. -1 means "nothing".
    const [dragFromIndex, setDragFromIndex] = useState(-1);
    const [dropTargetIndex, setDropTargetIndex] = useState(-1);
    // which edge of which card the red line is drawn on
    const [dropIndicator, setDropIndicator] = useState({ index: -1, edge: null });

    const containerRef = useRef(null);
    const nameInputRef = useRef(null);
    // set by Escape so that the blur it causes abandons the edit rather than
    // committing it. A ref rather than state because nothing on screen shows it.
    const escapeWasPressed = useRef(false);

    /**
     * A brand new list arrives with its name selected, so that naming it is
     * simply the next thing the user types.
     *
     * Note that this reads a request and then clears it. Without the clearing,
     * every later render would grab focus back, and the user would be unable to
     * click into anything else on the screen.
     */
    useEffect(() => {
        if (list === null || listNeedingNameFocus !== list.id) return;
        nameInputRef.current?.focus();
        nameInputRef.current?.select();
        clearNameFocusRequest();
    }, [list, listNeedingNameFocus, clearNameFocusRequest]);

    // Every hook above this line, so that they run in the same order on every
    // render. The name field is uncontrolled on purpose; see the note below.
    if (list === null) return null;

    // -------------------------------------------------------------------------
    // the list's name
    // -------------------------------------------------------------------------

    /**
     * A TRAP WORTH KNOWING ABOUT, because it is one of the few places React
     * quietly means something different by a familiar word.
     *
     * The obvious thing to write here is onChange. In plain DOM — which is what
     * HW1 used — the change event on a text field fires ONCE, when the user is
     * finished: on Enter, or on leaving the field. That is exactly when a rename
     * should happen.
     *
     * React's onChange is not that event. It is the INPUT event, renamed, and it
     * fires on every single keystroke. Writing onChange here would rename the
     * list once per letter typed.
     *
     * So the commit hangs off onBlur, and Enter simply blurs the field. That
     * gets back the DOM's own meaning of "the user is finished", which is what
     * we wanted in the first place.
     */
    function handleNameBlur(event) {
        if (escapeWasPressed.current) {
            // Escape means abandon the edit, so put the old name back and change
            // nothing at all
            escapeWasPressed.current = false;
            event.target.value = list.name;
            return;
        }
        renameList(event.target.value);
    }

    function handleNameKeyDown(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            event.target.blur();
        } else if (event.key === 'Escape') {
            escapeWasPressed.current = true;
            event.target.blur();
        }
    }

    // -------------------------------------------------------------------------
    // drag and drop
    // -------------------------------------------------------------------------

    function handleDragStart(index, event) {
        setDragFromIndex(index);
        event.dataTransfer.effectAllowed = 'move';
        // Firefox refuses to start a drag unless something is on the clipboard
        event.dataTransfer.setData('text/plain', String(index));
    }

    /**
     * Works out where the dragged card would land, and which edge to draw the
     * red line on.
     *
     * @param {DragEvent} event a dragover anywhere in the container
     */
    function computeDropTarget(event) {
        const cards = [...(containerRef.current?.querySelectorAll('.item-card') ?? [])];
        if (cards.length === 0) return { destination: -1, indicator: { index: -1, edge: null } };

        const cardUnderCursor = event.target.closest?.('.item-card') ?? null;
        let insertionPoint;
        let indicator;

        if (cardUnderCursor === null) {
            // the cursor is in the empty space below the last card
            insertionPoint = cards.length;
            indicator = { index: cards.length - 1, edge: 'after' };
        } else {
            const bounds = cardUnderCursor.getBoundingClientRect();
            const isBelowMidline = (event.clientY - bounds.top) > (bounds.height / 2);
            const cardIndex = Number(cardUnderCursor.dataset.index);

            insertionPoint = isBelowMidline ? cardIndex + 1 : cardIndex;
            indicator = { index: cardIndex, edge: isBelowMidline ? 'after' : 'before' };
        }

        // the adjustment described at the top of this file
        let destination = insertionPoint;
        if (dragFromIndex < destination) destination--;

        return { destination, indicator };
    }

    function handleDragOver(event) {
        if (dragFromIndex < 0) return;

        // without this the browser will not allow a drop at all
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';

        const { destination, indicator } = computeDropTarget(event);
        setDropTargetIndex(destination);
        setDropIndicator(indicator);
    }

    function handleDrop(event) {
        if (dragFromIndex < 0) return;
        event.preventDefault();

        const fromIndex = dragFromIndex;
        const toIndex = dropTargetIndex;
        endDrag();

        if (toIndex >= 0 && toIndex !== fromIndex) {
            moveItem(fromIndex, toIndex);
        }
    }

    /**
     * dragend fires whether the drag ended in a drop, on the wrong place, or with
     * the Escape key, so this is where cleanup belongs.
     */
    function endDrag() {
        setDragFromIndex(-1);
        setDropTargetIndex(-1);
        setDropIndicator({ index: -1, edge: null });
    }

    return (
        <section className="flex min-h-0 flex-1 flex-col" aria-label="List editor">
            <div className="flex items-center gap-3 bg-sbu-red px-4 py-2.5 text-sbu-white shadow-bar">
                <div className="flex gap-1.5">
                    {/*
                        The Wolfie in the corner does exactly what the close button
                        on the far right does, and calls the very same function
                        rather than one of its own. Two ways out of a list, one
                        place for it to go wrong.
                    */}
                    <button
                        id="home-button" type="button" onClick={closeList}
                        title="Close this list and return to the home screen"
                        aria-label="Close this list and return to the home screen"
                        className={`${TOOLBAR_BUTTON} flex items-center justify-center p-0`}>
                        <img className="h-6 w-auto drop-shadow-[0_0.0625rem_0.125rem_rgba(0,0,0,0.35)]"
                             src="/images/wolfie-logo.png" alt="" width="1464" height="1054" />
                    </button>
                    <button
                        id="undo-button" type="button" onClick={undo} disabled={!canUndo}
                        title="Undo (Ctrl+Z)" aria-label="Undo"
                        className={TOOLBAR_BUTTON}>
                        ↶
                    </button>
                    <button
                        id="redo-button" type="button" onClick={redo} disabled={!canRedo}
                        title="Redo (Ctrl+Y)" aria-label="Redo"
                        className={TOOLBAR_BUTTON}>
                        ↷
                    </button>
                </div>

                <div className="flex min-w-0 flex-1 justify-center">
                    {/*
                        THE NAME FIELD IS UNCONTROLLED, AND THAT IS DELIBERATE.

                        The obvious React answer is value={list.name} with an
                        onChange handler. That is wrong here for a concrete
                        reason: React's onChange fires per keystroke, and a list
                        should be renamed once, when the user is finished typing.
                        See the note on handleNameBlur above.

                        So the field holds its own text while it is being typed
                        in, and the key below is what puts a new name into it
                        from outside. Changing key throws the old input away and
                        builds a new one with a fresh defaultValue, which is how
                        an uncontrolled field is legitimately reset.

                        Note that this only remounts when the name genuinely
                        changes, which is once per rename rather than once per
                        keystroke. Had the commit been on onChange, this key
                        would have rebuilt the input on every letter and the
                        field would have thrown away focus mid-word.
                    */}
                    <input
                        id="list-name-input"
                        key={list.name}
                        ref={nameInputRef}
                        type="text"
                        defaultValue={list.name}
                        maxLength={60}
                        spellCheck={false}
                        autoComplete="off"
                        aria-label="The name of this list"
                        onBlur={handleNameBlur}
                        onKeyDown={handleNameKeyDown}
                        className="w-full max-w-[32rem] truncate rounded-control border
                                   border-transparent bg-transparent px-3 py-1.5 text-center
                                   text-[1.25rem] font-bold text-sbu-white
                                   hover:border-white/45
                                   focus:border-sbu-white focus:bg-sbu-white
                                   focus:text-grey-900 focus:outline-none" />
                </div>

                <div className="ml-auto flex gap-1.5">
                    <button
                        id="close-button" type="button" onClick={closeList}
                        title="Close this list" aria-label="Close this list"
                        className={TOOLBAR_BUTTON}>
                        ✕
                    </button>
                </div>
            </div>

            <div className="relative flex min-h-0 flex-1 flex-col px-6 pt-5 max-[46rem]:px-3.5 max-[46rem]:pt-4">
                {/*
                   These headers use the very same grid as an item card, which
                   is what keeps the columns lined up. The transparent left
                   border stands in for the accent stripe down a card's edge,
                   and the extra horizontal padding stands in for the insets
                   the scrolling container puts around the cards. Miss the
                   second and every fixed width column is drawn half a pace to
                   the right of the values underneath it.
                */}
                {list.items.length === 0 ? (
                    <p id="list-empty-message"
                       className="m-auto pb-16 text-center text-[1.0625rem] text-grey-500">
                        This list is empty.
                    </p>
                ) : (
                    <>
                        <div className="item-column-headers item-grid gap-3 border-l-[0.3125rem]
                                        border-l-transparent pr-[1.375rem] pb-2 pl-[1rem]
                                        text-[0.6875rem] font-bold tracking-[0.09em] uppercase
                                        text-grey-500 max-[46rem]:hidden"
                             aria-hidden="true">
                            <span className="area-handle" />
                            <span className="area-description">Task</span>
                            <span className="area-entered text-center">Date Entered</span>
                            <span className="area-priority text-center">Priority</span>
                            <span className="area-target text-center">Target Date</span>
                            <span className="area-completed text-center">Completed</span>
                            <span className="area-actions" />
                        </div>

                        <ol
                            id="item-card-container"
                            ref={containerRef}
                            aria-label="The items in this list"
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                            className="card-container card-scroll m-0 min-h-0 flex-1 list-none
                                       overflow-x-hidden overflow-y-auto pt-0.5 pr-2 pb-22 pl-0.5">
                            {list.items.map((item, index) => (
                                <ItemCard
                                    key={item.id}
                                    item={item}
                                    index={index}
                                    dropEdge={dropIndicator.index === index ? dropIndicator.edge : null}
                                    isBeingDragged={dragFromIndex === index}
                                    onOpen={() => requestEditItem(index)}
                                    onDuplicate={() => duplicateItem(index)}
                                    onDelete={() => requestDeleteItem(index)}
                                    onDragStart={handleDragStart}
                                    onDragEnd={endDrag} />
                            ))}
                        </ol>
                    </>
                )}
                <Fab id="add-item-button" label="Add a new item" onClick={requestAddItem} />
            </div>
        </section>
    );
}

/** shared by the four toolbar buttons, which are identical but for their faces */
const TOOLBAR_BUTTON =
    'h-10 w-10 cursor-pointer rounded-control border-none bg-transparent text-[1.375rem] ' +
    'leading-none text-sbu-white transition-[background-color,opacity] duration-150 ' +
    'hover:not-disabled:bg-white/[0.18] active:not-disabled:bg-black/[0.18] ' +
    'disabled:cursor-default disabled:opacity-35';

const HARD_CODED_ROW =
    'item-grid mt-2.5 items-center gap-3 rounded-card border-l-[0.3125rem] ' +
    'border-l-grey-300 bg-sbu-white px-[0.875rem] py-2.5 shadow-card first:mt-0';

const HARD_CODED_DESCRIPTION = 'area-description min-w-0 truncate font-semibold';

const HARD_CODED_DATE = 'area-entered text-center text-[0.875rem] tabular-nums text-grey-700';
