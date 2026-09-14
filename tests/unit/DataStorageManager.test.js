// @vitest-environment jsdom
/**
 * DataStorageManager.test.js
 *
 * THIS IS A UNIT TEST THAT NEEDS A DOCUMENT, which is exactly the case the
 * comment in vitest.config.js describes. Local storage belongs to the window,
 * so this one file opts into jsdom while every other unit test runs with no DOM
 * at all. Scope and environment are two different questions.
 *
 * THE LOAD BEARING TESTS IN THIS FILE
 * -----------------------------------
 * The quarantine group. When saved data cannot be parsed, it is moved aside
 * rather than deleted, so that a student who has been building a list all
 * semester can still recover it by hand from dev tools. Getting that wrong
 * destroys somebody's work silently, which is the worst kind of bug this
 * application can have.
 *
 * And "having saved anything at all is what marks a browser as no longer new".
 * A user who has deliberately deleted every list must not be given the example
 * lists back on their next visit.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DataStorageManager, StorageError } from '../../src/data/DataStorageManager.js';
import { createWolfieList } from '../../src/model/wolfieList.js';
import { createListItem } from '../../src/model/listItem.js';

const KEY = DataStorageManager.STORAGE_KEY;
const QUARANTINE = DataStorageManager.QUARANTINE_KEY;

/**
 * The Singleton is the one piece of genuinely global state left in the
 * application, so it is the one thing a test still has to reset by hand. This
 * is what replaced HW1's vi.resetModules() before every single test.
 */
beforeEach(() => {
    DataStorageManager.resetInstanceForTesting();
    window.localStorage.clear();
});

afterEach(() => {
    window.localStorage.clear();
});

const storage = () => DataStorageManager.getInstance();

describe('the Singleton itself', () => {
    it('hands back the same instance every time', () => {
        expect(DataStorageManager.getInstance()).toBe(DataStorageManager.getInstance());
    });

    it('refuses to be constructed directly', () => {
        expect(() => new DataStorageManager()).toThrow(/singleton/i);
    });

    /**
     * The latch that lets getInstance() through has to close behind it. If it
     * did not, one legitimate getInstance() would leave the door open for any
     * number of direct constructions afterwards.
     */
    it('closes the door again after building the one instance', () => {
        DataStorageManager.getInstance();
        expect(() => new DataStorageManager()).toThrow(/singleton/i);
    });

    it('uses a key of its own rather than the one HW1 wrote under', () => {
        expect(KEY).toBe('cse316.wolfie-lists.hw2.v1');
        expect(KEY).not.toBe('cse316.wolfie-lists.v2');
    });
});

describe('isAvailable', () => {
    it('is true when local storage works', () => {
        expect(storage().isAvailable()).toBe(true);
    });

    it('leaves nothing behind after probing', () => {
        storage().isAvailable();
        expect(window.localStorage.length).toBe(0);
    });

    /**
     * Certain browsers in certain privacy modes define localStorage and then
     * throw the moment it is used, which is why this is tested by using it
     * rather than by checking that it exists.
     */
    it('is false when local storage throws on use', () => {
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new Error('denied');
        });
        expect(storage().isAvailable()).toBe(false);
    });
});

describe('hasSavedData', () => {
    it('is false on a browser that has never run this application', () => {
        expect(storage().hasSavedData()).toBe(false);
    });

    /**
     * THE LOAD BEARING ONE. "Are there any lists" and "has this browser ever
     * saved anything" are different questions. A user who deleted every list has
     * saved an empty collection, and that is a decision to respect rather than
     * to undo by handing them the example lists again.
     */
    it('is true once an empty collection has been saved', () => {
        storage().saveLists([]);
        expect(storage().hasSavedData()).toBe(true);
    });
});

describe('saveLists and loadLists', () => {
    it('reads back exactly what was written', () => {
        const lists = [
            createWolfieList({
                name: 'Weekend',
                items: [createListItem({ description: 'hike', targetDate: '2026-09-19' })]
            })
        ];

        storage().saveLists(lists);
        const loaded = storage().loadLists();

        expect(loaded).toEqual(lists);
    });

    it('preserves every id across the round trip', () => {
        const lists = [createWolfieList({ items: [createListItem({ description: 'x' })] })];
        storage().saveLists(lists);

        const loaded = storage().loadLists();
        expect(loaded[0].id).toBe(lists[0].id);
        expect(loaded[0].items[0].id).toBe(lists[0].items[0].id);
    });

    it('hands back an empty array on a first run', () => {
        expect(storage().loadLists()).toEqual([]);
    });

    it('hands back an empty array when the entry is blank', () => {
        window.localStorage.setItem(KEY, '   ');
        expect(storage().loadLists()).toEqual([]);
    });

    it('accepts a bare array as well as the wrapped payload', () => {
        window.localStorage.setItem(KEY, JSON.stringify([{ name: 'Bare', items: [] }]));
        expect(storage().loadLists()[0].name).toBe('Bare');
    });

    it('writes a versioned payload rather than a bare array', () => {
        storage().saveLists([]);
        const payload = JSON.parse(window.localStorage.getItem(KEY));

        expect(payload.version).toBe(1);
        expect(payload.savedAt).toEqual(expect.any(String));
        expect(payload.lists).toEqual([]);
    });

    it('reports a full quota as something the user can act on', () => {
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            const error = new Error('full');
            error.name = 'QuotaExceededError';
            throw error;
        });

        expect(() => storage().saveLists([])).toThrow(StorageError);
        expect(() => storage().saveLists([])).toThrow(/no room left/i);
    });

    it('reports any other write failure too', () => {
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new Error('denied');
        });
        expect(() => storage().saveLists([])).toThrow(/could not be saved/i);
    });
});

describe('unreadable data', () => {
    it('throws rather than starting with a half understood list', () => {
        window.localStorage.setItem(KEY, '{ this is not json');
        expect(() => storage().loadLists()).toThrow(StorageError);
    });

    it('throws when the payload is well formed JSON of the wrong shape', () => {
        window.localStorage.setItem(KEY, JSON.stringify({ lists: 'not an array' }));
        expect(() => storage().loadLists()).toThrow(StorageError);
    });

    /**
     * THE LOAD BEARING ONE. Somebody's data is being set aside, not thrown away.
     */
    it('moves unreadable data to the quarantine key rather than deleting it', () => {
        const damaged = '{ this is not json';
        window.localStorage.setItem(KEY, damaged);

        expect(() => storage().loadLists()).toThrow();

        expect(window.localStorage.getItem(QUARANTINE)).toBe(damaged);
        expect(window.localStorage.getItem(KEY)).toBeNull();
    });

    it('starts empty on the next attempt, having set the bad data aside', () => {
        window.localStorage.setItem(KEY, 'not json at all');
        expect(() => storage().loadLists()).toThrow();
        expect(storage().loadLists()).toEqual([]);
    });
});

describe('loadStarterLists', () => {
    it('builds real lists out of the example file', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => ({
            ok: true,
            json: async () => ({
                lists: [{ name: 'Example', items: [{ description: 'try me' }] }]
            })
        })));

        const lists = await storage().loadStarterLists();
        expect(lists).toHaveLength(1);
        expect(lists[0].name).toBe('Example');
        expect(lists[0].items[0].description).toBe('try me');
    });

    /**
     * The starter file deliberately carries no ids, so that reading it twice
     * could never produce two items sharing one.
     */
    it('mints fresh ids for everything it reads', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => ({
            ok: true,
            json: async () => ([{ name: 'Example', items: [{ description: 'a' }] }])
        })));

        const first = await storage().loadStarterLists();
        const second = await storage().loadStarterLists();

        expect(first[0].id).not.toBe(second[0].id);
        expect(first[0].items[0].id).not.toBe(second[0].items[0].id);
    });

    it('says so when the file is missing', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 404 })));
        await expect(storage().loadStarterLists()).rejects.toThrow(/404/);
    });

    it('says so when the file is not a list of lists', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({}) })));
        await expect(storage().loadStarterLists()).rejects.toThrow(/list of lists/);
    });
});

describe('clear', () => {
    it('removes both the saved data and anything quarantined', () => {
        storage().saveLists([createWolfieList({ name: 'Doomed' })]);
        window.localStorage.setItem(QUARANTINE, 'old rubbish');

        storage().clear();

        expect(window.localStorage.getItem(KEY)).toBeNull();
        expect(window.localStorage.getItem(QUARANTINE)).toBeNull();
    });
});
