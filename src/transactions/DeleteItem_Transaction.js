import { jsTPS_Transaction } from '../lib/jsTPS.js';

export class DeleteItem_Transaction extends jsTPS_Transaction {
    #operations;
    #index;
    #item;

    constructor(operations, index, item) {
        super();
        this.#operations = operations;
        this.#index = index;
        this.#item = item;
    }

    doTransaction() {
        this.#operations.removeItemAt(this.#index);
    }

    undoTransaction() {
        this.#operations.addItem(this.#item, this.#index);
    }

    toString() {
        return `DeleteItem_Transaction(index ${this.#index})`;
    }
}