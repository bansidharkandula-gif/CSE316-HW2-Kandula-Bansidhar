/**
 * DuplicateItem_Transaction.js
 *
 * The jsTPS library employs the Command design pattern, and each transaction,
 * including this one, is used as a command: an undoable action packaged as an
 * object with doTransaction() and undoTransaction().
 *
 * Copies one item and drops the copy in directly beneath the original.
 *
 * The copy is made once, before this transaction is ever run, and then reused on
 * every redo so that the duplicate keeps one stable id no matter how much undoing
 * and redoing happens.
 */
import { jsTPS_Transaction } from '../lib/jsTPS.js';

export class DuplicateItem_Transaction extends jsTPS_Transaction {
    #operations;
    #index;
    #copy;

    /**
     * @param {Object} operations the list operations handed out by CurrentListContext
     * @param {number} index which item was duplicated
     * @param {Object} copy the copy to insert, already made
     */
    constructor(operations, index, copy) {
        super();
        this.#operations = operations;
        this.#index = index;
        this.#copy = copy;
    }

    doTransaction() {
        this.#operations.addItem(this.#copy, this.#index + 1);
    }

    undoTransaction() {
        this.#operations.removeItemAt(this.#index + 1);
    }

    toString() {
        return `DuplicateItem_Transaction(index ${this.#index})`;
    }
}
