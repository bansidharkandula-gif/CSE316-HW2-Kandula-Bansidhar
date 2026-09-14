/**
 * listItem.test.js
 *
 * The item model on its own, with no document and no React.
 */
import { describe, expect, it } from 'vitest';
import {
    cloneItem,
    createListItem,
    itemFromJSON,
    itemValues,
    valuesAreEqual
} from '../../src/model/listItem.js';
import { DateUtil } from '../../src/common/DateUtil.js';

const VALUES = {
    description: 'Finish HW2',
    dateEntered: '2026-09-01',
    priority: 'High',
    targetDate: '2026-09-15',
    completed: true
};

describe('createListItem', () => {
    it('gives every field a default', () => {
        const item = createListItem();

        expect(item.id).toMatch(/^item-/);
        expect(item.description).toBe('');
        expect(item.dateEntered).toBe(DateUtil.today());
        expect(item.priority).toBe('Low');
        expect(item.targetDate).toBeNull();
        expect(item.completed).toBe(false);
    });

    it('keeps the values it is given', () => {
        expect(createListItem(VALUES)).toMatchObject(VALUES);
    });

    it('keeps an id it is given', () => {
        expect(createListItem({ id: 'item-fixed' }).id).toBe('item-fixed');
    });

    it('gives two items two different ids', () => {
        expect(createListItem().id).not.toBe(createListItem().id);
    });
});

describe('itemValues', () => {
    it('reports every field but the id', () => {
        expect(itemValues(createListItem(VALUES))).toEqual(VALUES);
    });
});

describe('valuesAreEqual', () => {
    it('is true for two identical snapshots', () => {
        expect(valuesAreEqual(VALUES, { ...VALUES })).toBe(true);
    });

    it.each(Object.keys(VALUES))('is false when only %s differs', (field) => {
        const changed = { ...VALUES, [field]: field === 'completed' ? false : 'something else' };
        expect(valuesAreEqual(VALUES, changed)).toBe(false);
    });
});

describe('cloneItem', () => {
    it('copies every value but gives the copy an id of its own', () => {
        const original = createListItem(VALUES);
        const copy = cloneItem(original);

        expect(itemValues(copy)).toEqual(itemValues(original));
        expect(copy.id).not.toBe(original.id);
    });
});

describe('itemFromJSON', () => {
    it('survives a trip through JSON unchanged', () => {
        const item = createListItem(VALUES);
        expect(itemFromJSON(JSON.parse(JSON.stringify(item)))).toEqual(item);
    });

    it('gives an item with no id a new one, as the starter file needs', () => {
        expect(itemFromJSON(VALUES).id).toMatch(/^item-/);
    });

    it('builds a usable item out of an empty object', () => {
        const item = itemFromJSON({});
        expect(item.description).toBe('');
        expect(item.priority).toBe('Low');
        expect(item.completed).toBe(false);
    });

    it('cleans hand edited rubbish rather than trusting it', () => {
        const item = itemFromJSON({
            priority: 'Urgent',
            dateEntered: 'last tuesday',
            targetDate: 'soon',
            completed: 'yes'
        });

        expect(item.priority).toBe('Low');
        expect(item.dateEntered).toBe(DateUtil.today());
        expect(item.targetDate).toBeNull();
        expect(item.completed).toBe(false);
    });
});
