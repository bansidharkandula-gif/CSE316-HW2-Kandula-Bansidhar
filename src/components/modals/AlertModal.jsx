/**
 * AlertModal.jsx
 *
 * The informative modal, for the times the application simply has to tell the
 * user something: an item was saved without a description, local storage is
 * full, the saved data could not be read.
 *
 * This exists instead of the browser's own alert() for two reasons. The built in
 * one freezes the entire page while it is up, and it looks like the browser
 * talking rather than like our application talking.
 */
import { useRef } from 'react';
import { ModalNames, useModals } from '../../context/ModalContext.jsx';
import Modal, { ModalButton, ModalFooter, ModalHeading, ModalMessage } from './Modal.jsx';

export default function AlertModal() {
    const { alertModal, closeAlertModal } = useModals();
    const okRef = useRef(null);

    if (alertModal === null) return null;

    return (
        <Modal
            name={ModalNames.ALERT}
            id="alert-modal"
            role="alertdialog"
            labelledBy="alert-modal-heading"
            describedBy="alert-modal-message"
            small
            // there is only one way out of an informative modal, so Escape and OK
            // do the same thing
            onCancel={closeAlertModal}
            initialFocusRef={okRef}>

            <ModalHeading id="alert-modal-heading" titleId="alert-modal-title" icon="ℹ">
                {alertModal.title}
            </ModalHeading>

            <ModalMessage id="alert-modal-message">{alertModal.message}</ModalMessage>

            <ModalFooter>
                <div className="ml-auto flex gap-2">
                    <ModalButton id="alert-ok-button" ref={okRef} variant="primary"
                                 onClick={closeAlertModal}>
                        OK
                    </ModalButton>
                </div>
            </ModalFooter>
        </Modal>
    );
}
