/**
 * app.js
 *
 * Shared helpers for the Playwright tests.
 *
 * Everything that can be proved without a browser is proved in tests/unit and
 * tests/integration, in jsdom. What is left here is what only a real browser can
 * answer:
 *
 *   - does Vite really compile and serve every module, with no console error
 *   - does the first ever visit really fetch and show the example lists
 *   - does a change really survive a page reload, in Chrome's own local storage
 *   - does Chrome's own drag and drop really reorder a card
 *   - does Ctrl+Z really reach our handler rather than the browser's
 *
 * Every test starts in a fresh browser context, which means empty local storage,
 * which means every test is a first ever visit. That is why the starter lists in
 * public/data/starter_lists.json are the fixture here.
 *
 * ON SELECTORS
 * ------------
 * These find things the way the integration tests do: by id where the provided
 * code has one, and otherwise by accessible name, by label, or by the few class
 * names and attributes listed in the assignment. Nothing here depends on a
 * Tailwind class, because styling is free to change and a test that breaks when
 * a margin does is not testing the application.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect } from '@playwright/test';

/** where the application keeps its lists, and where it sets aside unreadable data */
export const STORAGE_KEY = 'cse316.wolfie-lists.hw2.v1';
export const QUARANTINE_KEY = 'cse316.wolfie-lists.hw2.unreadable';

/**
 * The example lists, read from the very file the application fetches, so that
 * the example data is free to change and these tests follow along.
 */
export const STARTER_LISTS = JSON.parse(readFileSync(
    fileURLToPath(new URL('../../../public/data/starter_lists.json', import.meta.url)),
    'utf8')).lists;

/** the names of the lists in public/data/starter_lists.json, in order */
export const STARTER_LIST_NAMES = STARTER_LISTS.map((list) => list.name);

/** what each list card's subtitle should read, in order */
export const STARTER_LIST_SUBTITLES = STARTER_LISTS.map((list) => (list.items.length === 0)
    ? 'No items yet'
    : `${list.items.filter((item) => item.completed).length} of ${list.items.length} completed`);

/**
 * The list most of these tests work in, found by shape rather than by name: one
 * of exactly three items, at least one completed and at least one not.
 */
const SAMPLE_LIST = (() => {
    const sample = STARTER_LISTS.find((list) => list.items.length === 3
        && list.items.some((item) => item.completed)
        && list.items.some((item) => !item.completed));
    if (sample === undefined) {
        throw new Error(
            'the end to end tests need one starter list of exactly three items, at least one '
            + 'completed and at least one not, and public/data/starter_lists.json no longer '
            + 'has one');
    }
    return sample;
})();

/** the name of that list */
export const SAMPLE_LIST_NAME = SAMPLE_LIST.name;

/** any other starter list, for the tests that need a second one */
export const OTHER_LIST_NAME = STARTER_LIST_NAMES.find((name) => name !== SAMPLE_LIST_NAME);

/** its three items exactly as the file has them, in order */
export const SAMPLE_LIST_ITEMS = SAMPLE_LIST.items.map((item) => ({ ...item }));

/** the descriptions of those items, in order */
export const SAMPLE_ITEMS = SAMPLE_LIST_ITEMS.map((item) => item.description);

/** where the finished and the unfinished items sit, which the file decides */
export const SAMPLE_COMPLETED_INDEX = SAMPLE_LIST_ITEMS.findIndex((item) => item.completed);
export const SAMPLE_UNFINISHED_INDEX = SAMPLE_LIST_ITEMS.findIndex((item) => !item.completed);

/**
 * @param {string|null} isoDate
 * @return {string} that date as an item card shows it, i.e. 08/20/2026
 */
export function displayDate(isoDate) {
    if (typeof isoDate !== 'string') return '—';
    const [year, month, day] = isoDate.split('-');
    return `${month}/${day}/${year}`;
}

/** @return {import('@playwright/test').Locator} the home screen */
export const homeView = (page) => page.getByRole('region', { name: 'Home' });

/** @return {import('@playwright/test').Locator} the list screen */
export const listView = (page) => page.getByRole('region', { name: 'List editor' });

/**
 * Opens the application and waits until the home screen has finished drawing.
 * On a first visit the lists arrive from a fetch, so this waits for a card
 * rather than for the page load.
 */
export async function openApp(page) {
    await page.goto('/');
    await expect(page.locator('.list-card').first()).toBeVisible();
}

/** Opens one of the lists on the home screen by name. */
export async function openList(page, name) {
    await page.locator('.list-card', { hasText: name }).first().click();
    await expect(listView(page)).toBeVisible();
}

/** @return {import('@playwright/test').Locator} every list card on the home screen */
export const listCards = (page) => page.locator('#list-card-container .list-card');

/** @return {import('@playwright/test').Locator} the list card for one list */
export const listCardNamed = (page, name) => page.locator('.list-card', { hasText: name }).first();

/** @return {import('@playwright/test').Locator} every item card in the open list */
export const itemCards = (page) => page.locator('#item-card-container .item-card');

/** @return {import('@playwright/test').Locator} the item card at one position */
export const itemCardAt = (page, index) =>
    page.locator(`#item-card-container .item-card[data-index="${index}"]`);

/** @return {import('@playwright/test').Locator} an item card's duplicate button */
export const duplicateButton = (card) => card.getByRole('button', { name: /^Duplicate the item/ });

/** @return {import('@playwright/test').Locator} an item card's delete button */
export const deleteButton = (card) => card.getByRole('button', { name: /^Delete the item/ });

/** @return {import('@playwright/test').Locator} the + button in the list view */
export const addItemButton = (page) => page.getByRole('button', { name: 'Add a new item' });

/** @return {Promise<string[]>} the descriptions of the items on screen, in order */
export async function itemDescriptions(page) {
    return page.locator('#item-card-container .item-card .item-description').allTextContents();
}

/** @return {Promise<string[]>} the names of the lists on the home screen */
export async function listNames(page) {
    return page.locator('#list-card-container .list-card-title').allTextContents();
}

/** the item modal's controls, found by label as the assignment names them */
export const modal = {
    description: (page) => page.locator('#item-description-input'),
    dateEntered: (page) => page.locator('#item-date-entered-input'),
    priority: (page) => page.getByLabel('Priority', { exact: true }),
    targetDate: (page) => page.getByLabel(/meant to be finished by/),
    completed: (page) => page.getByLabel('Completed', { exact: true }),
    previous: (page) => page.locator('#item-modal').getByRole('button', { name: /Previous/ }),
    next: (page) => page.locator('#item-next-button'),
    ok: (page) => page.locator('#item-ok-button'),
    cancel: (page) => page.locator('#item-cancel-button')
};

/**
 * Fills in the item modal and presses a button.
 *
 * @param {Object} values
 * @param {string} press one of ok, cancel, next, previous
 */
export async function fillItemModal(
    page, { description, dateEntered, priority, targetDate, completed } = {}, press = 'ok') {
    await expect(page.locator('#item-modal')).toBeVisible();

    if (description !== undefined) await modal.description(page).fill(description);
    if (dateEntered !== undefined) await modal.dateEntered(page).fill(dateEntered);
    if (priority !== undefined) await modal.priority(page).selectOption(priority);
    if (targetDate !== undefined) await modal.targetDate(page).fill(targetDate);
    if (completed !== undefined) await modal.completed(page).setChecked(completed);

    await modal[press](page).click();
}

/**
 * The item modal's heading tells a user where they are while stepping through a
 * list, so it has to carry both the position and the total.
 */
export async function expectHeadingShowsItem(page, position, total) {
    const heading = page.locator('#item-modal-heading');
    await expect(heading).toHaveText(new RegExp(`\\b${position}\\b`));
    await expect(heading).toHaveText(new RegExp(`\\b${total}\\b`));
}

/** @return {Promise<Object|null>} what the application has written to local storage */
export async function readSavedData(page) {
    return page.evaluate((key) => {
        const raw = window.localStorage.getItem(key);
        return raw === null ? null : JSON.parse(raw);
    }, STORAGE_KEY);
}
