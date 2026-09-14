/**
 * harness.jsx
 *
 * Two ways of putting the application on screen for a test.
 *
 * COMPARE THIS FILE WITH HW1'S tests/helpers/app.js, WHICH WAS 250 LINES
 * ---------------------------------------------------------------------
 * That file had to reset the module registry before every single test, rebuild
 * the entire module graph, mount index.html into jsdom, remove the document
 * level event handlers that had accumulated since the last test, and export the
 * application's classes itself so that a statically imported one could not be
 * left over from a previous graph with instanceof quietly returning false.
 *
 * None of that is here, and none of it is needed. A React tree is built fresh by
 * render() and unmounted by cleanup() after every test, taking its state, its
 * effects and its event handlers with it. What is left is genuinely small.
 *
 * The one thing that still leaks is the storage Singleton, because it is
 * deliberately global, so resetStorage() below is called by every test file that
 * touches it. That single remaining reset is a good illustration of the trade
 * the Singleton pattern makes.
 */
import { StrictMode, useEffect } from 'react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../src/App.jsx';
import { CurrentListProvider, useCurrentList } from '../../src/context/CurrentListContext.jsx';
import { ListsProvider, useLists } from '../../src/context/ListsContext.jsx';
import { ModalProvider, useModals } from '../../src/context/ModalContext.jsx';
import { useListEditor } from '../../src/hooks/useListEditor.js';
import { DataStorageManager } from '../../src/data/DataStorageManager.js';
import { seedStorage } from './fixtures.js';

/**
 * Puts the storage Singleton and local storage back to how a test found them.
 * Call from beforeEach in any file that renders the application.
 */
export function resetStorage() {
    DataStorageManager.resetInstanceForTesting();
    window.localStorage.clear();
}

/**
 * Renders the whole application, the way a user meets it.
 *
 * @param {Object} options
 * @param {Object[]} options.lists plain JSON lists to seed storage with, or null
 * to leave storage empty and let the first-visit path run
 * @return {Object} the testing library result, plus a userEvent instance
 */
export function renderApp({ lists } = {}) {
    if (lists !== null) seedStorage(lists ?? undefined);

    return {
        user: userEvent.setup(),
        ...render(<StrictMode><App /></StrictMode>)
    };
}

/**
 * Renders just the contexts, with one list already open, and hands the test
 * direct access to the editor hook.
 *
 * This is what the transaction tests use. They drive the REAL contexts, the real
 * jsTPS and the real storage Singleton rather than mocks, which is what makes
 * them integration tests rather than unit tests.
 *
 * That is a deliberate judgment call, and worth stating because a student will
 * ask. A mocked context would be faster and would still be a fair test of a
 * transaction's own logic — but it could not catch the bug those tests exist
 * for, which is undo handing back a rebuilt lookalike item instead of the
 * original. That bug only appears when the real collaborators are present.
 *
 * @param {Object} options
 * @param {Object[]} options.lists plain JSON lists to seed storage with
 * @param {number} options.openIndex which of them to open
 * @return {Object} `context`, whose .current is refreshed on every render and
 * holds the editor, the two contexts, and the modal controls
 */
export function renderOpenList({ lists, openIndex = 0 } = {}) {
    seedStorage(lists ?? undefined);

    // deliberately not state: the harness updates this on every render so a test
    // always reads the latest, and writing to it must never itself cause one
    const context = { current: null };

    function Probe() {
        context.current = {
            editor: useListEditor(),
            currentList: useCurrentList(),
            lists: useLists(),
            modals: useModals()
        };
        return null;
    }

    /**
     * Opens a list as soon as the lists have loaded, then renders
     * CurrentListProvider around the probe — which is exactly what App does, and
     * for the same reason. Mounting the provider only once a list is open is
     * what gives each list a transaction stack of its own.
     */
    function Harness() {
        const { isLoaded, lists: loaded, currentListId, openList } = useLists();

        useEffect(() => {
            if (!isLoaded || currentListId !== null || loaded.length === 0) return;
            openList(loaded[openIndex].id);
        }, [isLoaded, loaded, currentListId, openList]);

        if (currentListId === null) return null;

        return (
            <CurrentListProvider>
                <Probe />
            </CurrentListProvider>
        );
    }

    const result = render(
        <StrictMode>
            <ModalProvider>
                <ListsProvider>
                    <Harness />
                </ListsProvider>
            </ModalProvider>
        </StrictMode>
    );

    return { context, user: userEvent.setup(), ...result };
}
