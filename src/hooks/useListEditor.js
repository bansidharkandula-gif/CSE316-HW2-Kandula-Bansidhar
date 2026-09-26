/**
 * useListEditor.js
 *
 * Everything the list screen can do, as one hook. A component calls
 * duplicateItem(index) and never has to know about the contexts, the
 * transaction stack or the model behind it.
 */
import { useCurrentList } from '../context/CurrentListContext.jsx';
import { useLists } from '../context/ListsContext.jsx';
import { useModals } from '../context/ModalContext.jsx';
import { cloneItem, createListItem, itemValues, valuesAreEqual } from '../model/listItem.js';
import { normalizeListName } from '../model/wolfieList.js';
import { AddItem_Transaction } from '../transactions/AddItem_Transaction.js';
import { DeleteItem_Transaction } from '../transactions/DeleteItem_Transaction.js';
import { DuplicateItem_Transaction } from '../transactions/DuplicateItem_Transaction.js';
import { EditItem_Transaction } from '../transactions/EditItem_Transaction.js';

/** what the item modal is currently being used for */
export const ItemModalModes = {
    CREATE: 'create',
    EDIT: 'edit'
};

export function useListEditor() {
    const { list, operations, addTransaction, undo, redo, canUndo, canRedo } = useCurrentList();
    const { closeList } = useLists();
    const { openItemModal, closeItemModal, inform, askConfirm } = useModals();

    function requestEditItem(index) {
        openItemModal({
            mode: ItemModalModes.EDIT,
            index,
            itemCount: list.items.length,
            values: itemValues(list.items[index])
        });
    }

    function requestAddItem() {
        openItemModal({
            mode: ItemModalModes.CREATE,
            index: -1,
            itemCount: list.items.length,
            values: itemValues(createListItem())
        });
    }

    /**
     * OK or Next in the item modal. Records the edit, or does nothing if
     * nothing changed.
     *
     * @param {Object} request { mode, index, values, then } where then is
     * 'close' or 'next'
     */
    function commitItemModal({ mode = ItemModalModes.EDIT, index, values, then = 'close' }) {
        // the alert opens on top of the item modal, so what was typed is kept
        if (values.description === '') {
            inform({ title: 'A Description Is Required', message: 'Every item needs a description.' });
            return;
        }

        if (mode === ItemModalModes.CREATE) {
            const item = createListItem(values);
            addTransaction(new AddItem_Transaction(operations, list.items.length, item));
            closeItemModal();
            return;
        }     

        const oldValues = itemValues(list.items[index]);
        if (!valuesAreEqual(oldValues, values)) {
            addTransaction(new EditItem_Transaction(operations, index, oldValues, values));
        }

        if (then === 'next') {
            requestEditItem(index + 1);
        } else if (then === 'previous') {
            requestEditItem(index - 1);
        } else {
            closeItemModal();
        }
    }

    /** the copy is made here, once, so every redo puts back the same copy */
    function duplicateItem(index) {
        addTransaction(new DuplicateItem_Transaction(operations, index, cloneItem(list.items[index])));
    }

    function requestDeleteItem(index) {
        const item = list.items[index];
        askConfirm({
            title: 'Delete This Item?',
            message: `The item "${item.description}" will be removed from this list. You can undo this.`,
            acceptLabel: 'Delete Item',
            onAccept: () => addTransaction(new DeleteItem_Transaction(operations, index, item))
        });
    }

    function moveItem(fromIndex, toIndex) {
        if (fromIndex === toIndex) return;
        operations.moveItem(fromIndex, toIndex);
    }

    function renameList(requestedName) {
        const newName = normalizeListName(requestedName);
        if (newName === list.name) return;
        operations.setName(newName);
    }

    return {
        list,
        items: list?.items ?? [],
        canUndo,
        canRedo,
        undo,
        redo,
        closeList,
        requestAddItem,
        requestEditItem,
        commitItemModal,
        duplicateItem,
        requestDeleteItem,
        moveItem,
        renameList
    };
}
