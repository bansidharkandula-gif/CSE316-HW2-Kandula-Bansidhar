import { jsTPS_Transaction } from '../lib/jsTPS.js';

export class AddItem_Transaction extends jsTPS_Transaction {
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
        this.#operations.addItem(this.#item, this.#index);
    }

    undoTransaction() {
        this.#operations.removeItemAt(this.#index);
    }

    toString() {
        return `AddItem_Transaction(index ${this.#index})`;
    }
}