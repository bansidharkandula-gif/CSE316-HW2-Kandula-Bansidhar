/**
 * EditItem_Transaction.js
 *
 * The jsTPS library employs the Command design pattern, and each transaction,
 * including this one, is used as a command: an undoable action packaged as an
 * object with doTransaction() and undoTransaction().
 *
 * Records one trip through the item modal: the values the item had before OK was
 * pressed, and the values it has after.
 *
 * Both snapshots are plain value objects taken with itemValues(), never
 * references to the item itself. If we stored the item, then "before" and
 * "after" would describe the same thing and undo would have nothing to restore.
 *
 * Note that applying a snapshot does not replace the item with a different one.
 * The operation this calls builds a new item carrying these values and THE SAME
 * ID, so an edit leaves the item recognizably the same item. That is what makes
 * "undo an edit" different from "delete and re-add".
 */
import { jsTPS_Transaction } from '../lib/jsTPS.js';

export class EditItem_Transaction extends jsTPS_Transaction {
    #operations;
    #index;
    #oldValues;
    #newValues;

    /**
     * @param {Object} operations the list operations handed out by CurrentListContext
     * @param {number} index which item was edited
     * @param {Object} oldValues its values before the edit
     * @param {Object} newValues its values after the edit
     */
    constructor(operations, index, oldValues, newValues) {
        super();
        this.#operations = operations;
        this.#index = index;
        // copied rather than kept by reference, so that nobody can change a
        // snapshot out from under this transaction after it has been filed away
        this.#oldValues = { ...oldValues };
        this.#newValues = { ...newValues };
    }

    doTransaction() {
        this.#operations.applyValues(this.#index, this.#newValues);
    }

    undoTransaction() {
        this.#operations.applyValues(this.#index, this.#oldValues);
    }

    toString() {
        return `EditItem_Transaction(index ${this.#index})`;
    }
}
