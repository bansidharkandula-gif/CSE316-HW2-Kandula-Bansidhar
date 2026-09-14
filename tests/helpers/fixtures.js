/**
 * fixtures.js
 *
 * Sample data, and the one function that puts it into local storage the way a
 * previous visit would have.
 *
 * Everything here is plain JSON rather than built model objects, deliberately.
 * A fixture that used createWolfieList would be testing the model against
 * itself; going in as JSON means every test also exercises the path a returning
 * user's data actually takes.
 */
import { DataStorageManager } from '../../src/data/DataStorageManager.js';

/**
 * A short list, small enough that a test can assert on it item by item.
 */
export const WEEKEND_LIST = {
    id: 'list-weekend',
    name: "Wolfie's Weekend",
    items: [
        {
            id: 'item-hike',
            description: 'Hike the Ashokan rail trail',
            dateEntered: '2026-09-01',
            priority: 'Medium',
            targetDate: '2026-09-19',
            completed: false
        },
        {
            id: 'item-read',
            description: 'Read chapter four',
            dateEntered: '2026-09-02',
            priority: 'High',
            targetDate: null,
            completed: true
        },
        {
            id: 'item-call',
            description: 'Call home',
            dateEntered: '2026-09-03',
            priority: 'Low',
            targetDate: '2026-09-20',
            completed: false
        }
    ]
};

export const CHORES_LIST = {
    id: 'list-chores',
    name: 'Chores',
    items: [
        {
            id: 'item-sweep',
            description: 'Sweep the kitchen',
            dateEntered: '2026-09-01',
            priority: 'Low',
            targetDate: null,
            completed: false
        }
    ]
};

export const EMPTY_LIST = {
    id: 'list-empty',
    name: 'Nothing Here Yet',
    items: []
};

/**
 * Writes lists into local storage in exactly the shape DataStorageManager
 * writes them, so that a test starts as a returning user rather than a new one.
 *
 * Note what this implies: a browser with saved data is not a first visit, so
 * nothing seeded this way ever fetches the example lists.
 *
 * @param {Object[]} lists plain JSON lists
 */
export function seedStorage(lists = [WEEKEND_LIST]) {
    window.localStorage.setItem(
        DataStorageManager.STORAGE_KEY,
        JSON.stringify({ version: 1, savedAt: new Date().toISOString(), lists }));
}

/**
 * @return {Object[]} the lists currently in local storage, as plain JSON. Used
 * by the tests that care that a change was actually written through.
 */
export function readStorage() {
    const raw = window.localStorage.getItem(DataStorageManager.STORAGE_KEY);
    return raw === null ? null : JSON.parse(raw).lists;
}
