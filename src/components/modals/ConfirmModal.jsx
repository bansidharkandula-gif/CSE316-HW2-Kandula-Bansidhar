/**
 * ConfirmModal.jsx
 *
 * The warning modal. Nothing in this application is destroyed without it: not a
 * list, not an item.
 *
 * WHAT WENT AWAY, AND WHY IT IS A REAL SIMPLIFICATION
 * ---------------------------------------------------
 * HW1's version carried a `context` object. The controller handed it
 * { action: 'delete-list', listId } when asking the question, this modal handed
 * that object straight back out with the answer, and AppController then had a
 * switch statement to work out what its own yes had meant. All of that existed
 * for one reason: the asker and the answer-handler were separate objects that
 * could only speak in events, so the question had to carry its own identity.
 *
 * Here the caller passes the function to run on yes. A closure carries whatever
 * that function needs — look at handleDeleteList in HomeView and note that it
 * closes over the list itself, read at the moment the question was asked, while
 * it was definitely still there. The context object, the switch statement,
 * and the whole category of "answered the wrong question" bug go away together.
 *
 * That is worth being pleased about, but it is worth naming what was traded for
 * it too. The switch was a single readable list of every destructive thing the
 * application could do. Now that list does not exist anywhere.
 */
import { useRef } from 'react';
import { ModalNames, useModals } from '../../context/ModalContext.jsx';
import Modal, { ModalButton, ModalFooter, ModalHeading, ModalMessage } from './Modal.jsx';

export default function ConfirmModal() {
    const { confirmModal, closeConfirmModal } = useModals();
    const declineRef = useRef(null);

    if (confirmModal === null) return null;

    function handleAccept() {
        // closed BEFORE the work is done, so that anything the action itself
        // wants to say — an informative modal about a failed save, say — opens
        // onto a clear screen rather than on top of a modal that is going away
        closeConfirmModal();
        confirmModal.onAccept?.();
    }

    return (
        <Modal
            name={ModalNames.CONFIRM}
            id="confirm-modal"
            role="alertdialog"
            labelledBy="confirm-modal-heading"
            describedBy="confirm-modal-message"
            small
            // Escape means no, exactly like the Cancel button
            onCancel={closeConfirmModal}
            // Focus starts on Cancel, not on the destructive button. Someone
            // hammering the Enter key should not be able to destroy anything by
            // accident.
            initialFocusRef={declineRef}>

            <ModalHeading id="confirm-modal-heading" titleId="confirm-modal-title" icon="⚠" warning>
                {confirmModal.title}
            </ModalHeading>

            <ModalMessage id="confirm-modal-message">{confirmModal.message}</ModalMessage>

            <ModalFooter>
                <div className="ml-auto flex gap-2">
                    <ModalButton id="confirm-decline-button" ref={declineRef}
                                 variant="secondary" onClick={closeConfirmModal}>
                        Cancel
                    </ModalButton>
                    <ModalButton id="confirm-accept-button" variant="danger" onClick={handleAccept}>
                        {confirmModal.acceptLabel}
                    </ModalButton>
                </div>
            </ModalFooter>
        </Modal>
    );
}
