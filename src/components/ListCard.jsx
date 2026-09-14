/**
 * ListCard.jsx
 *
 * One card on the home screen, standing for one list the user owns: the list's
 * name in bold on the left, how much of it is done underneath, and a delete
 * button on the right.
 *
 * WHAT REPLACED HW1's CARD TEMPLATES
 * ----------------------------------
 * In HW1 a home screen card took three pieces to make: a <template> in
 * index.html holding the blank markup, ListCardPrototype to clone that template
 * and pour a list's data into the copy, and CardPrototype above it holding the
 * cloning code both card types shared.
 *
 * A component does all of that in one place. It is markup and data in the same
 * expression, in one file, and there is no clone step, so a card can never be
 * stamped out and then only half filled in.
 *
 * The one rule that survives is the one about user text, and it survives for
 * free: {list.name} below is escaped by React, always. HW1 had to enforce that
 * by hand with textContent and had a test watching for anyone who used innerHTML
 * instead.
 */
import { countCompleted } from '../model/wolfieList.js';
import IconButton, { DELETE_GLYPH } from './IconButton.jsx';

export default function ListCard({ list, index, onOpen, onDelete }) {
    const total = list.items.length;
    const completed = countCompleted(list);
    const subtitle = (total === 0) ? 'No items yet' : `${completed} of ${total} completed`;

    /** a card is reachable by keyboard, so it has to be operable by keyboard */
    function handleKeyDown(event) {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        onOpen();
    }

    return (
        <li
            className="list-card group mt-2.5 flex cursor-pointer items-center gap-3
                       rounded-card border-l-[0.3125rem] border-l-sbu-red bg-sbu-white
                       px-[0.875rem] py-3.5 shadow-card transition-[box-shadow,transform]
                       duration-150 first:mt-0 hover:-translate-y-px hover:shadow-card-hover
                       focus-visible:outline-[0.1875rem] focus-visible:outline-offset-2
                       focus-visible:outline-sbu-red"
            data-list-id={list.id}
            data-index={index}
            role="button"
            tabIndex={0}
            aria-label={`Open the list named ${list.name}`}
            onClick={onOpen}
            onKeyDown={handleKeyDown}>

            <div className="flex min-w-0 flex-1 flex-col">
                <span className="list-card-title truncate text-[1.125rem] font-bold">
                    {list.name}
                </span>
                <span className="list-card-subtitle text-[0.8125rem] text-grey-500">
                    {subtitle}
                </span>
            </div>

            <div className="flex gap-1">
                <IconButton
                    action="delete-list"
                    label={`Delete the list named ${list.name}`}
                    glyph={DELETE_GLYPH}
                    danger
                    onClick={onDelete} />
            </div>
        </li>
    );
}
