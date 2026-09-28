import { jsTPS_Transaction } from '../lib/jsTPS.js';

export class MoveItem_Transaction extends jsTPS_Transaction {
    #operations;
    #fromIndex;
    #toIndex;

    constructor(operations, fromIndex, toIndex) {
        super();
        this.#operations = operations;
        this.#fromIndex = fromIndex;
        this.#toIndex = toIndex;
    }

    doTransaction() {
        this.#operations.moveItem(this.#fromIndex, this.#toIndex);
    }

    undoTransaction() {
        this.#operations.moveItem(this.#toIndex, this.#fromIndex);
    }

    toString() {
        return `MoveItem_Transaction(${this.#fromIndex} to ${this.#toIndex})`;
    }
}