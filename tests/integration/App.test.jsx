// @vitest-environment jsdom
/**
 * App.test.jsx
 *
 * The whole application, from starting up to writing through to storage. This is
 * the widest scope anything reaches without a real browser.
 *
 * THE LOAD BEARING TESTS IN THIS FILE
 * -----------------------------------
 * The first-visit group. "Having saved anything at all is what marks a browser
 * as no longer new" is the rule that decides whether a user is handed the
 * example lists, and getting it wrong either hands them back to somebody who
 * deliberately deleted everything, or never shows them to anybody at all.
 *
 * And the storage-failure group. Every one of those paths ends in the
 * application carrying on rather than dying, because a to-do list that refuses
 * to start is worse than one that starts empty.
 */
import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderApp, resetStorage } from '../helpers/harness.jsx';
import { readStorage, WEEKEND_LIST } from '../helpers/fixtures.js';
import { DataStorageManager } from '../../src/data/DataStorageManager.js';
// the real example file, read rather than repeated, so that editing it cannot
// break this test
import starterFile from '../../public/data/starter_lists.json';

beforeEach(resetStorage);

const listCards = () => screen.queryAllByRole('button', { name: /^Open the list named/ });

/** answers the one fetch the application makes with the real example file */
function serveStarterFile(payload = starterFile) {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => payload })));
}

describe('a brand new browser', () => {
    it('is given the example lists', async () => {
        serveStarterFile();
        renderApp({ lists: null });

        await waitFor(() => expect(listCards()).toHaveLength(starterFile.lists.length));
        for (const list of starterFile.lists) {
            expect(screen.getByRole('button', { name: `Open the list named ${list.name}` }))
                .toBeInTheDocument();
        }
    });

    it('saves them at once, so they are ordinary lists from that moment on', async () => {
        serveStarterFile();
        renderApp({ lists: null });

        await waitFor(() => expect(listCards()).toHaveLength(starterFile.lists.length));
        await waitFor(() => expect(readStorage()).toHaveLength(starterFile.lists.length));
    });

    it('gives every list and every item an id of its own', async () => {
        serveStarterFile();
        renderApp({ lists: null });

        await waitFor(() => expect(readStorage()).toHaveLength(starterFile.lists.length));

        const saved = readStorage();
        const ids = saved.flatMap((list) => [list.id, ...list.items.map((item) => item.id)]);
        expect(new Set(ids).size).toBe(ids.length);
    });
});

describe('a returning browser', () => {
    it('is given what it saved, and never fetches the example file', async () => {
        const fetchSpy = vi.fn();
        vi.stubGlobal('fetch', fetchSpy);

        renderApp({ lists: [WEEKEND_LIST] });

        await waitFor(() => expect(listCards()).toHaveLength(1));
        expect(fetchSpy).not.toHaveBeenCalled();
    });

    /**
     * THE LOAD BEARING ONE. A user who has deleted every list they had still has
     * saved data — an empty collection — and that is a decision of theirs to
     * respect rather than to undo.
     */
    it('that saved an empty collection is not given the example lists back', async () => {
        const fetchSpy = vi.fn();
        vi.stubGlobal('fetch', fetchSpy);

        renderApp({ lists: [] });

        await screen.findByText(/do not have any lists yet/i);
        expect(fetchSpy).not.toHaveBeenCalled();
    });
});

describe('persistence', () => {
    it('writes a new list through to storage', async () => {
        const { user } = renderApp({ lists: [] });
        await screen.findByText(/do not have any lists yet/i);

        await user.click(screen.getByRole('button', { name: 'Create a new list' }));
        await screen.findByLabelText('The name of this list');

        await waitFor(() => expect(readStorage()).toHaveLength(1));
        expect(readStorage()[0].name).toBe('Untitled List');
    });

    it('writes an item edit through to storage', async () => {
        const { user } = renderApp({ lists: [WEEKEND_LIST] });
        await user.click(await screen.findByRole('button', { name: /Open the list named Wolfie/ }));

        await user.click(await screen.findByRole('button',
            { name: 'Edit the item Hike the Ashokan rail trail' }));
        await user.clear(await screen.findByLabelText('Description'));
        await user.type(screen.getByLabelText('Description'), 'Hike Bear Mountain');
        await user.click(screen.getByRole('button', { name: 'OK' }));

        await waitFor(() => {
            expect(readStorage()[0].items[0].description).toBe('Hike Bear Mountain');
        });
    });

    it('writes an undo through to storage too', async () => {
        const { user } = renderApp({ lists: [WEEKEND_LIST] });
        await user.click(await screen.findByRole('button', { name: /Open the list named Wolfie/ }));

        await user.click(await screen.findByRole('button', { name: 'Delete the item Call home' }));
        await user.click(await screen.findByRole('button', { name: 'Delete Item' }));
        await waitFor(() => expect(readStorage()[0].items).toHaveLength(2));

        await user.click(screen.getByRole('button', { name: 'Undo' }));
        await waitFor(() => expect(readStorage()[0].items).toHaveLength(3));
    });

    /**
     * The guard on the save effect. Without it, the first render would write the
     * empty array the state was initialized to over a returning user's real
     * lists before the load had finished.
     */
    it('does not write anything before the load has finished', async () => {
        renderApp({ lists: [WEEKEND_LIST] });

        // whatever happens on the very first render, the saved data still has
        // the list in it
        await waitFor(() => expect(listCards()).toHaveLength(1));
        expect(readStorage()).toHaveLength(1);
        expect(readStorage()[0].items).toHaveLength(3);
    });
});

describe('when storage will not work', () => {
    it('says so and carries on when local storage is switched off', async () => {
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new Error('denied');
        });

        renderApp({ lists: null });

        expect(await screen.findByText('Nothing Can Be Saved')).toBeInTheDocument();
        // and the home screen is still usable
        expect(screen.getByRole('button', { name: 'Create a new list' })).toBeInTheDocument();
    });

    it('says so and starts empty when the saved data cannot be read', async () => {
        window.localStorage.setItem(DataStorageManager.STORAGE_KEY, '{ not json at all');
        // served for real, so that a user whose data was set aside and who was
        // then mistaken for a brand new one would visibly get the example lists
        serveStarterFile();

        renderApp({ lists: null });

        expect(await screen.findByText('Saved Lists Could Not Be Loaded')).toBeInTheDocument();
        expect(await screen.findByText(/do not have any lists yet/i)).toBeInTheDocument();
        expect(fetch).not.toHaveBeenCalled();
    });

    it('says so and starts empty when the example file cannot be read', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 404 })));

        renderApp({ lists: null });

        expect(await screen.findByText('Example Lists Could Not Be Loaded')).toBeInTheDocument();
        expect(await screen.findByText(/do not have any lists yet/i)).toBeInTheDocument();
    });
});

describe('moving between the two screens', () => {
    /**
     * The two screens are not both mounted with one hidden, which is what HW1
     * did with a .hidden class. Only one of them exists at a time.
     */
    it('has only one screen in the document at a time', async () => {
        const { user } = renderApp({ lists: [WEEKEND_LIST] });

        await waitFor(() => expect(listCards()).toHaveLength(1));
        expect(screen.queryByLabelText('The name of this list')).not.toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /Open the list named Wolfie/ }));

        await screen.findByLabelText('The name of this list');
        expect(listCards()).toHaveLength(0);
    });
});
