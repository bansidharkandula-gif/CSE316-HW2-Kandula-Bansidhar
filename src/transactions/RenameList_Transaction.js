import { jsTPS_Transaction } from '../lib/jsTPS.js';

export class RenameList_Transaction extends jsTPS_Transaction {
    #operations;
    #oldName;
    #newName;

    constructor(operations, oldName, newName) {
        super();
        this.#operations = operations;
        this.#oldName = oldName;
        this.#newName = newName;
    }

    doTransaction() {
        this.#operations.setName(this.#newName);
    }

    undoTransaction() {
        this.#operations.setName(this.#oldName);
    }

    toString() {
        return `RenameList_Transaction("${this.#oldName}" to "${this.#newName}")`;
    }
}