/**
 * persistence.spec.js
 *
 * Does a change actually survive the page being reloaded?
 *
 * This is the question that justifies the whole Playwright tier. The jsdom tests
 * prove the application writes the right text into jsdom's implementation of
 * local storage. Here the storage is Chrome's own, the page really is torn down
 * and rebuilt, and every module is loaded again from the server.
 */
import { test, expect } from '@playwright/test';
import {
    openApp, openList, homeView, listView, listCards, listNames, itemCards, itemCardAt,
    itemDescriptions, readSavedData, addItemButton, duplicateButton, deleteButton, fillItemModal,
    STORAGE_KEY, QUARANTINE_KEY, SAMPLE_ITEMS, STARTER_LIST_NAMES, SAMPLE_LIST_NAME
} from './support/app.js';

test.beforeEach(async ({ page }) => {
    await openApp(page);
});

test.describe('surviving a reload', () => {
    test('a new list is still there', async ({ page }) => {
        await page.locator('#add-list-button').click();
        await page.keyboard.type('Groceries');
        await page.keyboard.press('Enter');
        await page.locator('#close-button').click();

        await page.reload();

        await expect(listCards(page)).toHaveCount(STARTER_LIST_NAMES.length + 1);
        expect(await listNames(page)).toContain('Groceries');
    });

    test('a new item is still there, with all of its values', async ({ page }) => {
        await openList(page, SAMPLE_LIST_NAME);
        await addItemButton(page).click();
        await fillItemModal(page, {
            description: 'Buy a new leash',
            dateEntered: '2026-09-20',
            priority: 'High',
            targetDate: '2026-09-27',
            completed: true
        });

        await page.reload();
        await openList(page, SAMPLE_LIST_NAME);

        await expect(itemCards(page)).toHaveCount(4);
        const card = itemCardAt(page, 3);
        await expect(card.locator('.item-description')).toHaveText('Buy a new leash');
        await expect(card).toContainText('09/20/2026');
        await expect(card).toContainText('High');
        await expect(card).toContainText('09/27/2026');
        await expect(card).toHaveAttribute('aria-label', /, completed$/);
    });

    test('a deletion stays deleted', async ({ page }) => {
        await openList(page, SAMPLE_LIST_NAME);
        await deleteButton(itemCardAt(page, 1)).click();
        await page.locator('#confirm-accept-button').click();

        await page.reload();
        await openList(page, SAMPLE_LIST_NAME);

        expect(await itemDescriptions(page)).toEqual([SAMPLE_ITEMS[0], SAMPLE_ITEMS[2]]);
    });

    test('a rename sticks', async ({ page }) => {
        await openList(page, SAMPLE_LIST_NAME);
        await page.locator('#list-name-input').fill('Weekend Plans');
        await page.keyboard.press('Enter');

        await page.reload();

        expect(await listNames(page)).toContain('Weekend Plans');
    });

    test('an undone change is saved as undone', async ({ page }) => {
        // the undo has to reach local storage too, not merely the screen
        await openList(page, SAMPLE_LIST_NAME);
        await duplicateButton(itemCardAt(page, 0)).click();
        await expect(itemCards(page)).toHaveCount(4);

        await page.locator('#undo-button').click();
        await expect(itemCards(page)).toHaveCount(3);

        await page.reload();
        await openList(page, SAMPLE_LIST_NAME);

        await expect(itemCards(page)).toHaveCount(3);
    });
});

test.describe('what is not carried across a reload', () => {
    test('the undo history, which belongs to one visit to one list', async ({ page }) => {
        await openList(page, SAMPLE_LIST_NAME);
        await duplicateButton(itemCardAt(page, 0)).click();
        await expect(page.locator('#undo-button')).toBeEnabled();

        await page.reload();
        await openList(page, SAMPLE_LIST_NAME);

        await expect(page.locator('#undo-button')).toBeDisabled();
        await expect(page.locator('#redo-button')).toBeDisabled();
        // the edit itself survived, only its history did not
        await expect(itemCards(page)).toHaveCount(4);
    });

    test('which list was open, since the application always starts at home', async ({ page }) => {
        await openList(page, SAMPLE_LIST_NAME);

        await page.reload();

        await expect(homeView(page)).toBeVisible();
        await expect(listView(page)).toBeHidden();
    });
});

test.describe('what is written to local storage', () => {
    test('is a versioned envelope', async ({ page }) => {
        const saved = await readSavedData(page);

        expect(saved.version).toBe(1);
        expect(Array.isArray(saved.lists)).toBe(true);
        expect(Date.parse(saved.savedAt)).not.toBeNaN();
    });

    test('is written on every change, not only when the page is closed', async ({ page }) => {
        await openList(page, SAMPLE_LIST_NAME);
        await duplicateButton(itemCardAt(page, 0)).click();
        await expect(itemCards(page)).toHaveCount(4);

        // read it without reloading, i.e. the write already happened
        const saved = await readSavedData(page);
        const sample = saved.lists.find((list) => list.name === SAMPLE_LIST_NAME);
        expect(sample.items).toHaveLength(4);
    });

    test('carries every field of an item', async ({ page }) => {
        const saved = await readSavedData(page);
        const item = saved.lists[0].items[0];

        expect(Object.keys(item).sort()).toEqual(
            ['completed', 'dateEntered', 'description', 'id', 'priority', 'targetDate']);
    });
});

test.describe('recovering from damaged saved data', () => {
    test('sets it aside and starts empty rather than refusing to run', async ({ page }) => {
        await page.evaluate((key) => window.localStorage.setItem(key, '{ not json at all'), STORAGE_KEY);

        await page.goto('/');

        // the user is told, in our own modal rather than a browser dialog
        await expect(page.locator('#alert-modal')).toBeVisible();
        await expect(page.locator('#alert-modal-title')).toContainText('Could Not Be Loaded');

        await page.locator('#alert-ok-button').click();
        await expect(page.locator('#home-empty-message')).toBeVisible();

        // set aside, not destroyed, so it can still be recovered by hand
        const quarantined = await page.evaluate((key) => window.localStorage.getItem(key), QUARANTINE_KEY);
        expect(quarantined).toBe('{ not json at all');
    });

    test('lets the user carry on working afterwards', async ({ page }) => {
        await page.evaluate((key) => window.localStorage.setItem(key, 'nonsense'), STORAGE_KEY);
        await page.goto('/');
        await page.locator('#alert-ok-button').click();

        await page.locator('#add-list-button').click();
        await page.keyboard.type('Starting over');
        await page.keyboard.press('Enter');
        await page.locator('#close-button').click();

        await page.reload();

        expect(await listNames(page)).toEqual(['Starting over']);
    });
});
