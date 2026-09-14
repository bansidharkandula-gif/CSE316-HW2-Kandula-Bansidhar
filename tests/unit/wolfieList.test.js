/**
 * wolfieList.test.js
 *
 * The list model on its own, with no document and no React. Every write
 * function is also checked to leave the list it was given alone, because a list
 * changed in place is the one mistake that stops React redrawing.
 */
import { describe, expect, it } from 'vitest';
import {
    addItem,
    buildUnusedName,
    cloneList,
    countCompleted,
    createWolfieList,
    DEFAULT_LIST_NAME,
    listFromJSON,
    MAX_NAME_LENGTH,
    moveItem,
    normalizeListName,
    removeItemAt,
    replaceItemAt,
    withName
} from '../../src/model/wolfieList.js';
import { createListItem, itemValues } from '../../src/model/listItem.js';

/** a list of items described 'a', 'b', 'c' ... */
function listOf(...descriptions) {
    return createWolfieList({
        name: 'Letters',
        items: descriptions.map((description) => createListItem({ description }))
    });
}

function descriptionsOf(list) {
    return list.items.map((item) => item.description);
}

/** runs change, then checks it produced a new list and left the old one alone */
function expectUnchanged(list, change) {
    const before = JSON.stringify(list);
    const itemsBefore = list.items;
    const after = change(list);

    expect(after).not.toBe(list);
    expect(list.items).toBe(itemsBefore);
    expect(JSON.stringify(list)).toBe(before);
    return after;
}

describe('createWolfieList', () => {
    it('defaults to an empty list with the default name', () => {
        const list = createWolfieList();
        expect(list.id).toMatch(/^list-/);
        expect(list.name).toBe(DEFAULT_LIST_NAME);
        expect(list.items).toEqual([]);
    });

    it('keeps the values it is given', () => {
        const items = [createListItem()];
        const list = createWolfieList({ id: 'list-fixed', name: 'Chores', items });
        expect(list).toEqual({ id: 'list-fixed', name: 'Chores', items });
    });
});

describe('listFromJSON', () => {
    it('survives a trip through JSON unchanged', () => {
        const list = listOf('a', 'b');
        expect(listFromJSON(JSON.parse(JSON.stringify(list)))).toEqual(list);
    });

    it('gives a list and its items ids when the JSON has none, as the starter file needs', () => {
        const list = listFromJSON({ name: 'Starter', items: [{ description: 'x' }] });
        expect(list.id).toMatch(/^list-/);
        expect(list.items[0].id).toMatch(/^item-/);
    });

    it('builds a usable list out of an empty object', () => {
        const list = listFromJSON({});
        expect(list.name).toBe(DEFAULT_LIST_NAME);
        expect(list.items).toEqual([]);
    });
});

describe('normalizeListName', () => {
    it('trims surrounding whitespace', () => {
        expect(normalizeListName('  Chores  ')).toBe('Chores');
    });

    it('falls back to the default name when nothing is left', () => {
        expect(normalizeListName('   ')).toBe(DEFAULT_LIST_NAME);
    });

    it('cuts a name that is too long down to the limit', () => {
        expect(normalizeListName('x'.repeat(MAX_NAME_LENGTH + 10))).toHaveLength(MAX_NAME_LENGTH);
    });
});

describe('countCompleted', () => {
    it('counts the items that are done', () => {
        const list = createWolfieList({
            items: [
                createListItem({ completed: true }),
                createListItem(),
                createListItem({ completed: true })
            ]
        });
        expect(countCompleted(list)).toBe(2);
    });
});

describe('addItem', () => {
    it('adds at the end by default', () => {
        const list = expectUnchanged(listOf('a', 'b'), (l) => addItem(l, createListItem({ description: 'c' })));
        expect(descriptionsOf(list)).toEqual(['a', 'b', 'c']);
    });

    it('adds at a given index', () => {
        const list = addItem(listOf('a', 'c'), createListItem({ description: 'b' }), 1);
        expect(descriptionsOf(list)).toEqual(['a', 'b', 'c']);
    });

    it('keeps the list id and name', () => {
        const original = listOf('a');
        const list = addItem(original, createListItem());
        expect(list.id).toBe(original.id);
        expect(list.name).toBe(original.name);
    });
});

describe('removeItemAt', () => {
    it('removes the item at that index', () => {
        const list = expectUnchanged(listOf('a', 'b', 'c'), (l) => removeItemAt(l, 1));
        expect(descriptionsOf(list)).toEqual(['a', 'c']);
    });
});

describe('replaceItemAt', () => {
    it('swaps one item for another and leaves the rest alone', () => {
        const original = listOf('a', 'b', 'c');
        const replacement = { ...original.items[1], description: 'B' };
        const list = expectUnchanged(original, (l) => replaceItemAt(l, 1, replacement));

        expect(descriptionsOf(list)).toEqual(['a', 'B', 'c']);
        expect(list.items[0]).toBe(original.items[0]);
        expect(list.items[1].id).toBe(original.items[1].id);
    });
});

describe('moveItem', () => {
    it('moves an item forwards', () => {
        const list = expectUnchanged(listOf('a', 'b', 'c', 'd'), (l) => moveItem(l, 0, 2));
        expect(descriptionsOf(list)).toEqual(['b', 'c', 'a', 'd']);
    });

    it('moves an item backwards', () => {
        expect(descriptionsOf(moveItem(listOf('a', 'b', 'c', 'd'), 3, 1))).toEqual(['a', 'd', 'b', 'c']);
    });

    it('is its own inverse, for every pair of positions', () => {
        const original = listOf('a', 'b', 'c', 'd');
        for (let from = 0; from < 4; from++) {
            for (let to = 0; to < 4; to++) {
                const there = moveItem(original, from, to);
                expect(moveItem(there, to, from).items).toEqual(original.items);
            }
        }
    });
});

describe('withName', () => {
    it('renames the list and keeps its id and items', () => {
        const original = listOf('a');
        const list = expectUnchanged(original, (l) => withName(l, 'Renamed'));

        expect(list.name).toBe('Renamed');
        expect(list.id).toBe(original.id);
        expect(list.items).toBe(original.items);
    });
});

describe('cloneList', () => {
    it('copies every item, with new ids for the list and every item', () => {
        const original = listOf('a', 'b');
        const copy = cloneList(original, 'Letters (Copy)');

        expect(copy.name).toBe('Letters (Copy)');
        expect(copy.id).not.toBe(original.id);
        expect(copy.items.map(itemValues)).toEqual(original.items.map(itemValues));
        copy.items.forEach((item, index) => expect(item.id).not.toBe(original.items[index].id));
    });

    it('cuts a copy name that would be too long down to the limit', () => {
        expect(cloneList(listOf(), 'x'.repeat(MAX_NAME_LENGTH + 10)).name).toHaveLength(MAX_NAME_LENGTH);
    });
});

describe('buildUnusedName', () => {
    const named = (...names) => names.map((name) => createWolfieList({ name }));

    it('hands back the name as it is when nothing is using it', () => {
        expect(buildUnusedName(named('Chores'), 'Untitled List')).toBe('Untitled List');
    });

    it('appends 2, then 3, and so on', () => {
        expect(buildUnusedName(named('Untitled List'), 'Untitled List')).toBe('Untitled List 2');
        expect(buildUnusedName(named('Untitled List', 'Untitled List 2'), 'Untitled List')).toBe('Untitled List 3');
    });

    it('skips a number that is already taken', () => {
        expect(buildUnusedName(named('Untitled List', 'Untitled List 3'), 'Untitled List')).toBe('Untitled List 2');
    });
});
