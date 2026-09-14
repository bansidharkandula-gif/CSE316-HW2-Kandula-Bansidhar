/**
 * CurrentListContext.jsx
 *
 * Editing the open list, and the undo stack for those edits.
 *
 * App only mounts this provider while a list is open, so the transaction stack
 * is created when a list opens and thrown away when it closes. Undo can never
 * reach back into a list the user has left.
 */
import { createContext, useContext, useState } from 'react';
import { jsTPS } from '../lib/jsTPS.js';
import { useLists } from './ListsContext.jsx';
import { addItem, moveItem, removeItemAt, replaceItemAt, withName } from '../model/wolfieList.js';

const CurrentListContext = createContext(null);

export function useCurrentList() {
    const value = useContext(CurrentListContext);
    if (value === null) throw new Error('useCurrentList must be used inside a <CurrentListProvider>');
    return value;
}

export function CurrentListProvider({ children }) {
    const { currentList, updateList } = useLists();

    // created once per open list; the initializer function stops a new jsTPS
    // being built and thrown away on every render
    const [tps] = useState(() => new jsTPS());

    // the screen only needs these two facts about the stack
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);

    function refreshUndoRedo() {
        setCanUndo(tps.hasTransactionToUndo());
        setCanRedo(tps.hasTransactionToRedo());
    }

    // what the transactions call to change the list
    const listId = currentList?.id;
    const change = (updater) => updateList(listId, updater);
    const operations = {
        addItem: (item, index) => change((list) => addItem(list, item, index)),
        removeItemAt: (index) => change((list) => removeItemAt(list, index)),
        moveItem: (fromIndex, toIndex) => change((list) => moveItem(list, fromIndex, toIndex)),
        setName: (name) => change((list) => withName(list, name)),
        // keeps the item's id, which is what makes undoing an edit different
        // from deleting and re-adding
        applyValues: (index, values) =>
            change((list) => replaceItemAt(list, index, { ...list.items[index], ...values }))
    };

    const value = {
        list: currentList,
        operations,
        canUndo,
        canRedo,
        addTransaction(transaction) {
            tps.addTransaction(transaction);
            refreshUndoRedo();
        },
        undo() {
            if (!tps.hasTransactionToUndo()) return;
            tps.undoTransaction();
            refreshUndoRedo();
        },
        redo() {
            if (!tps.hasTransactionToRedo()) return;
            tps.doTransaction();
            refreshUndoRedo();
        }
    };

    return <CurrentListContext.Provider value={value}>{children}</CurrentListContext.Provider>;
}
