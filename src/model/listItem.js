/**
 * listItem.js
 *
 * One row inside a Wolfie List. An item is a plain object:
 *
 *     { id, description, dateEntered }
 *
 * Nothing here ever changes an item. To edit one, build a new object carrying
 * the same id, i.e. { ...item, ...newValues }.
 */
import { IdGenerator } from '../common/IdGenerator.js';
import { DateUtil } from '../common/DateUtil.js';

/**
 * @param {Object} values any of the item's fields, the rest get defaults
 * @return {Object} a new item
 */
export function createListItem(values = {}) {
    return {
        id: IdGenerator.next('item'),
        description: '',
        dateEntered: DateUtil.today(),
        ...values
    };
}

/**
 * @return {Object} everything but the id, i.e. what the item modal edits and
 * what an edit transaction remembers
 */
export function itemValues(item) {
    const { id, ...values } = item;
    return values;
}

/** @return {boolean} true if the two sets of values match field for field */
export function valuesAreEqual(oldValues, newValues) {
    return Object.keys({ ...oldValues, ...newValues })
        .every((field) => oldValues[field] === newValues[field]);
}

/** @return {Object} a copy of the item with an id of its own */
export function cloneItem(item) {
    return { ...item, id: IdGenerator.next('item') };
}

/**
 * Rebuilds an item read from local storage or the starter file. This is the
 * one place item data is checked, because it is the one place bad data can get
 * in: a missing id gets a new one and a malformed date is replaced with today.
 */
export function itemFromJSON(json) {
    return {
        id: json.id ?? IdGenerator.next('item'),
        description: String(json.description ?? ''),
        dateEntered: DateUtil.clean(json.dateEntered) ?? DateUtil.today()
    };
}
