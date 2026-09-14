/**
 * ModalContext.jsx
 *
 * Which modals are open and what each one is showing.
 *
 * Open modals are kept as a stack, because one can open on top of another: OK
 * in the item modal with no description puts the alert modal over it. Only the
 * modal on top responds to the keyboard.
 */
import { createContext, useContext, useEffect, useState } from 'react';

const ModalContext = createContext(null);

export const ModalNames = {
    ITEM: 'item',
    CONFIRM: 'confirm',
    ALERT: 'alert'
};

export function useModals() {
    const value = useContext(ModalContext);
    if (value === null) throw new Error('useModals must be used inside a <ModalProvider>');
    return value;
}

export function ModalProvider({ children }) {
    // the open modals, bottom first, each one { name, ...what it shows }
    const [openModals, setOpenModals] = useState([]);

    function show(name, request) {
        setOpenModals((previous) => [
            ...previous.filter((modal) => modal.name !== name),
            { name, ...request }
        ]);
    }

    function hide(name) {
        setOpenModals((previous) => previous.filter((modal) => modal.name !== name));
    }

    function find(name) {
        return openModals.find((modal) => modal.name === name) ?? null;
    }

    // while any modal is open, the body class stops the page behind it being clicked
    useEffect(() => {
        document.body.classList.toggle('modal-is-open', openModals.length > 0);
    }, [openModals]);

    const value = {
        itemModal: find(ModalNames.ITEM),
        confirmModal: find(ModalNames.CONFIRM),
        alertModal: find(ModalNames.ALERT),
        topModal: openModals.at(-1)?.name ?? null,
        isAnyModalOpen: openModals.length > 0,

        /** request: { mode, index, itemCount, values } */
        openItemModal: (request) => show(ModalNames.ITEM, request),
        closeItemModal: () => hide(ModalNames.ITEM),

        /** request: { title, message, acceptLabel, onAccept } */
        askConfirm: (request) => show(ModalNames.CONFIRM, { acceptLabel: 'Delete', ...request }),
        closeConfirmModal: () => hide(ModalNames.CONFIRM),

        /** request: { title, message } */
        inform: (request) => show(ModalNames.ALERT, { title: 'Notice', message: '', ...request }),
        closeAlertModal: () => hide(ModalNames.ALERT)
    };

    return <ModalContext.Provider value={value}>{children}</ModalContext.Provider>;
}
