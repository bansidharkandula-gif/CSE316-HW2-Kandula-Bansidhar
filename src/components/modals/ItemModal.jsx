/**
 * ItemModal.jsx
 *
 * The modal that pops up on top of a list for viewing and editing one item. It
 * carries a labelled control for each of an item's fields, Next for walking the
 * list without closing the box, and OK and Cancel.
 *
 * This modal changes nothing. It reads a set of values in, hands the values the
 * user typed back out to commitItemModal, and lets the editor hook decide
 * whether that becomes an edit transaction, or nothing at all because the user
 * changed their mind.
 *
 * Next commits first and then moves, which is what makes it useful: a user can
 * open the first item, fix a typo, press Next, fix the next one, and every one
 * of those fixes lands on the undo stack as its own transaction.
 *
 * THE FORM IS CONTROLLED, WHICH THE LIST NAME FIELD IS NOT
 * -------------------------------------------------------
 * Worth comparing the two, because the reasons differ and the choice is not a
 * matter of house style.
 *
 * Here the fields are held in one piece of state and every keystroke goes
 * through React. That is what a form usually wants: the values have to be read
 * as a set when OK is pressed, Next has to replace all of them at once, and
 * nothing is written to the model until the user says so, so there is no cost
 * to re-rendering on each keystroke.
 *
 * The list name field in the toolbar is uncontrolled for the opposite reason: it
 * writes to the model as soon as the user finishes typing, and writing on every
 * keystroke would rename the list one letter at a time.
 *
 * The `key` on this component in ModalLayer is what reloads the fields when Next
 * moves to a different item; see the note there.
 */
import { useRef, useState } from 'react';
import { ModalNames, useModals } from '../../context/ModalContext.jsx';
import { useListEditor } from '../../hooks/useListEditor.js';
import { DateUtil } from '../../common/DateUtil.js';
import Modal, { ModalButton, ModalFooter, ModalHeading } from './Modal.jsx';

export default function ItemModal() {
    const { itemModal, closeItemModal } = useModals();
    const { commitItemModal } = useListEditor();

    const descriptionRef = useRef(null);

    // one piece of state for the whole form, so that Next can replace every
    // field in a single update
    const [values, setValues] = useState(() => ({
        description: itemModal.values.description ?? '',
        dateEntered: itemModal.values.dateEntered ?? DateUtil.today()
    }));

    function setField(field, value) {
        setValues((previous) => ({ ...previous, [field]: value }));
    }

    /**
     * Validates on the way out and hands the values over.
     *
     * @param {string} then 'close' or 'next'
     */
    function commit(then) {
        commitItemModal({
            mode: itemModal.mode,
            index: itemModal.index,
            values: {
                ...values,
                description: values.description.trim(),
                dateEntered: values.dateEntered || DateUtil.today()
            },
            then
        });
    }

    /**
     * Pressing Enter anywhere in the form is the same as pressing OK.
     * preventDefault also stops the browser from submitting the form itself.
     */
    function handleFormKeyDown(event) {
        if (event.key !== 'Enter') return;
        event.preventDefault();
        commit('close');
    }

    // Next is meaningless on the last item
    const canGoNext = itemModal.index < itemModal.itemCount - 1;

    return (
        <Modal
            name={ModalNames.ITEM}
            id="item-modal"
            labelledBy="item-modal-heading"
            // Escape means cancel, exactly like the Cancel button
            onCancel={closeItemModal}
            // the description is the field the user actually came here to type
            // in, so that is where focus belongs, not on whatever control happens
            // to come first
            initialFocusRef={descriptionRef}>

            <ModalHeading id="item-modal-heading">
                {`Item ${itemModal.index + 1} of ${itemModal.itemCount}`}
            </ModalHeading>

            <form id="item-modal-form" autoComplete="off"
                  onKeyDown={handleFormKeyDown}
                  onSubmit={(event) => event.preventDefault()}
                  className="flex flex-col gap-4 p-5">

                <div className={FIELD}>
                    <label className={FIELD_LABEL} htmlFor="item-description-input">Description</label>
                    <input
                        id="item-description-input"
                        ref={descriptionRef}
                        type="text"
                        maxLength={200}
                        placeholder="What needs to be done?"
                        value={values.description}
                        onChange={(event) => setField('description', event.target.value)}
                        className={CONTROL} />
                </div>

                <div className={FIELD_ROW}>
                    <div className={FIELD}>
                        <label className={FIELD_LABEL} htmlFor="item-date-entered-input">Date Entered</label>
                        <input
                            id="item-date-entered-input"
                            type="date"
                            value={values.dateEntered ?? ''}
                            onChange={(event) => setField('dateEntered', event.target.value)}
                            className={`${CONTROL} min-w-36`} />
                    </div>
                </div>
            </form>

            <ModalFooter>
                <div className="flex gap-2">
                    <ModalButton id="item-next-button" variant="quiet"
                                 disabled={!canGoNext}
                                 title="Save and move to the next item"
                                 onClick={() => commit('next')}>
                        Next&nbsp;▶
                    </ModalButton>
                </div>
                <div className="ml-auto flex gap-2">
                    <ModalButton id="item-cancel-button" variant="secondary"
                                 onClick={closeItemModal}>
                        Cancel
                    </ModalButton>
                    <ModalButton id="item-ok-button" variant="primary"
                                 onClick={() => commit('close')}>
                        OK
                    </ModalButton>
                </div>
            </ModalFooter>
        </Modal>
    );
}

const FIELD = 'flex min-w-0 flex-1 flex-col gap-[0.3125rem]';

const FIELD_LABEL =
    'text-xs font-bold tracking-[0.08em] uppercase text-grey-700';

const FIELD_ROW =
    'flex items-end gap-4 max-[46rem]:flex-col max-[46rem]:items-stretch';

const CONTROL =
    'w-full rounded-control border border-grey-300 bg-sbu-white px-2.5 py-2 text-base '
    + 'text-grey-900 placeholder:text-grey-500 '
    + 'focus:border-sbu-red focus:outline-2 focus:outline-offset-[0.0625rem] focus:outline-sbu-red '
    + 'disabled:cursor-not-allowed disabled:bg-grey-100 disabled:text-grey-500';
