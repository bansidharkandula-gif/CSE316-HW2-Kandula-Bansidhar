/**
 * jsTPS.test.js
 *
 * The transaction stack itself, driven with toy transactions that do nothing but
 * record that they ran. Nothing from the application is involved, which is the
 * point: jsTPS is a general purpose library and knows nothing about lists.
 *
 * src/lib/jsTPS.js is byte for byte the file HW1 used, so this file is very
 * nearly HW1's test of it. That is worth noticing rather than skipping past. The
 * Command pattern did not need rewriting for React — the parts of HW1 that had
 * to change were the parts that talked to the DOM or mutated the model, and a
 * transaction stack does neither.
 *
 * THE LOAD BEARING TEST here is the cursor arithmetic group, and in particular
 * "adding after undoing throws the redo branch away". That is the behavior every
 * editor has and nobody thinks about until it is wrong.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { jsTPS, jsTPS_Transaction } from '../../src/lib/jsTPS.js';

/** a transaction that appends to a shared log, so a test can read what happened */
class LoggingTransaction extends jsTPS_Transaction {
    constructor(log, name) {
        super();
        this.log = log;
        this.name = name;
    }

    doTransaction() {
        this.log.push(`do ${this.name}`);
    }

    undoTransaction() {
        this.log.push(`undo ${this.name}`);
    }

    toString() {
        return `LoggingTransaction(${this.name})`;
    }
}

describe('jsTPS_Transaction', () => {
    /**
     * JavaScript has no abstract keyword, so the base class enforces it by
     * throwing. A subclass that forgets one of the two methods finds out at once.
     */
    it('refuses to be used without both methods being overridden', () => {
        class Incomplete extends jsTPS_Transaction {}
        const transaction = new Incomplete();

        expect(() => transaction.doTransaction()).toThrow(/must override doTransaction/);
        expect(() => transaction.undoTransaction()).toThrow(/must override undoTransaction/);
    });

    it('names the offending subclass in the error', () => {
        class ForgotToImplement extends jsTPS_Transaction {}
        expect(() => new ForgotToImplement().doTransaction())
            .toThrow(/ForgotToImplement/);
    });
});

describe('jsTPS', () => {
    let tps;
    let log;

    beforeEach(() => {
        tps = new jsTPS();
        log = [];
    });

    const add = (name) => {
        const transaction = new LoggingTransaction(log, name);
        tps.addTransaction(transaction);
        return transaction;
    };

    describe('a brand new stack', () => {
        it('has nothing to undo and nothing to redo', () => {
            expect(tps.hasTransactionToUndo()).toBe(false);
            expect(tps.hasTransactionToRedo()).toBe(false);
            expect(tps.getSize()).toBe(0);
        });

        it('does nothing when asked to undo or redo anyway', () => {
            tps.undoTransaction();
            tps.doTransaction();
            expect(log).toEqual([]);
        });
    });

    describe('adding', () => {
        it('performs a transaction as soon as it is added', () => {
            add('first');
            expect(log).toEqual(['do first']);
        });

        it('leaves something to undo and nothing to redo', () => {
            add('first');
            expect(tps.hasTransactionToUndo()).toBe(true);
            expect(tps.hasTransactionToRedo()).toBe(false);
        });
    });

    describe('undo and redo', () => {
        it('undoes the most recent transaction', () => {
            add('first');
            add('second');
            tps.undoTransaction();

            expect(log).toEqual(['do first', 'do second', 'undo second']);
        });

        it('walks all the way back down the stack', () => {
            add('first');
            add('second');
            tps.undoTransaction();
            tps.undoTransaction();

            expect(log.slice(2)).toEqual(['undo second', 'undo first']);
            expect(tps.hasTransactionToUndo()).toBe(false);
            expect(tps.hasTransactionToRedo()).toBe(true);
        });

        it('redoes in the order the transactions were originally done', () => {
            add('first');
            add('second');
            tps.undoTransaction();
            tps.undoTransaction();
            log.length = 0;

            tps.doTransaction();
            tps.doTransaction();
            expect(log).toEqual(['do first', 'do second']);
        });

        it('can be driven back and forth any number of times', () => {
            add('only');
            for (let round = 0; round < 5; round++) {
                tps.undoTransaction();
                tps.doTransaction();
            }
            expect(tps.hasTransactionToUndo()).toBe(true);
            expect(tps.hasTransactionToRedo()).toBe(false);
        });

        it('stops at the bottom rather than going past it', () => {
            add('only');
            tps.undoTransaction();
            tps.undoTransaction();
            tps.undoTransaction();

            expect(log.filter((entry) => entry === 'undo only')).toHaveLength(1);
        });

        it('stops at the top rather than going past it', () => {
            add('only');
            tps.doTransaction();
            tps.doTransaction();

            expect(log.filter((entry) => entry === 'do only')).toHaveLength(1);
        });
    });

    describe('the cursor arithmetic', () => {
        /**
         * THE LOAD BEARING ONE. Doing something new while partway down the stack
         * throws the redo branch away, exactly like the undo behavior of any
         * editor you have ever used. An implementation that kept the branch would
         * let a user redo their way into a state that never existed.
         */
        it('throws the redo branch away when something new is done', () => {
            add('first');
            add('second');
            tps.undoTransaction();

            expect(tps.hasTransactionToRedo()).toBe(true);
            add('third');

            expect(tps.hasTransactionToRedo()).toBe(false);
            expect(tps.getSize()).toBe(2);
        });

        it('reports how much there is to undo and to redo', () => {
            add('first');
            add('second');
            add('third');
            expect(tps.getUndoSize()).toBe(3);
            expect(tps.getRedoSize()).toBe(0);

            tps.undoTransaction();
            expect(tps.getUndoSize()).toBe(2);
            expect(tps.getRedoSize()).toBe(1);
        });
    });

    describe('clearAllTransactions', () => {
        it('empties the stack completely', () => {
            add('first');
            add('second');
            tps.clearAllTransactions();

            expect(tps.getSize()).toBe(0);
            expect(tps.hasTransactionToUndo()).toBe(false);
            expect(tps.hasTransactionToRedo()).toBe(false);
        });

        it('does not undo anything on its way out', () => {
            add('first');
            log.length = 0;
            tps.clearAllTransactions();
            expect(log).toEqual([]);
        });
    });

    describe('toString', () => {
        it('shows the stack with a marker at the cursor', () => {
            add('first');
            add('second');
            tps.undoTransaction();

            const text = tps.toString();
            expect(text).toContain('LoggingTransaction(first)');
            expect(text).toContain('LoggingTransaction(second)');
            expect(text).toContain('<-- most recent');
        });
    });
});
