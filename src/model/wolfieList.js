/**
 * wolfieList.js
 *
 * A single named to-do list. A list is a plain object:
 *
 *     { id, name, items }
 *
 * Every function here returns a NEW list rather than changing the one it was
 * given, because React only redraws when it is handed a different object. That
 * is why these use toSpliced and with, the versions of splice and items[i] = x
 * that leave the original array alone.
 */
import { IdGenerator } from '../common/IdGenerator.js';
import { itemFromJSON } from './listItem.js';

export const DEFAULT_LIST_NAME = 'Untitled List';
export const MAX_NAME_LENGTH = 60;

/**
 * @param {Object} values any of the list's fields, the rest get defaults
 * @return {Object} a new list
 */
export function createWolfieList(values = {}) {
    return {
        id: IdGenerator.next('list'),
        name: DEFAULT_LIST_NAME,
        items: [],
        ...values
    };
}

/** Rebuilds a list read from local storage or the starter file. */
export function listFromJSON(json) {
    return {
        id: json.id ?? IdGenerator.next('list'),
        name: String(json.name ?? DEFAULT_LIST_NAME),
        items: (Array.isArray(json.items) ? json.items : []).map(itemFromJSON)
    };
}

/** @return {string} what the user typed, trimmed, shortened and never empty */
export function normalizeListName(name) {
    const trimmed = name.trim();
    return trimmed === '' ? DEFAULT_LIST_NAME : trimmed.slice(0, MAX_NAME_LENGTH);
}

/** @return {number} how many of the list's items are done */
export function countCompleted(list) {
    return list.items.filter((item) => item.completed).length;
}

export function addItem(list, item, index = list.items.length) {
    return { ...list, items: list.items.toSpliced(index, 0, item) };
}

export function removeItemAt(list, index) {
    return { ...list, items: list.items.toSpliced(index, 1) };
}

export function replaceItemAt(list, index, item) {
    return { ...list, items: list.items.with(index, item) };
}

/** Its own inverse: moveItem(list, to, from) undoes moveItem(list, from, to). */
export function moveItem(list, fromIndex, toIndex) {
    const moved = list.items[fromIndex];
    return { ...list, items: list.items.toSpliced(fromIndex, 1).toSpliced(toIndex, 0, moved) };
}

export function withName(list, name) {
    return { ...list, name };
}

/**
 * @return {string} desiredName if no list has it, otherwise the first of
 * "desiredName 2", "desiredName 3" and so on that is free
 */
export function buildUnusedName(lists, desiredName) {
    const taken = new Set(lists.map((list) => list.name));
    let name = desiredName;
    for (let counter = 2; taken.has(name); counter++) {
        name = `${desiredName} ${counter}`;
    }
    return name;
}
