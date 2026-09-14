/**
 * ListsContext.jsx
 *
 * Every list the user owns, which one is open, and saving and loading them.
 *
 * Creating and deleting a whole list are not undoable, so they live
 * here. Edits made inside the open list go through CurrentListContext instead.
 */
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { DataStorageManager } from '../data/DataStorageManager.js';
import { buildUnusedName, createWolfieList, DEFAULT_LIST_NAME } from '../model/wolfieList.js';
import { useModals } from './ModalContext.jsx';

const ListsContext = createContext(null);

export function useLists() {
    const value = useContext(ListsContext);
    if (value === null) throw new Error('useLists must be used inside a <ListsProvider>');
    return value;
}

export function ListsProvider({ children }) {
    const [lists, setLists] = useState([]);
    const [currentListId, setCurrentListId] = useState(null);
    const [isLoaded, setIsLoaded] = useState(false);

    // the id of a just created list, so ListView knows to select its name
    const [listNeedingNameFocus, setListNeedingNameFocus] = useState(null);

    // false once we know storage is unusable, so the user is only told once
    const canSave = useRef(true);

    const { inform } = useModals();
    const storage = DataStorageManager.getInstance();

    /**
     * Load once, at startup: the saved lists, or the starter lists on a browser
     * that has never run the app. A failure is reported, never fatal.
     *
     * In development React runs this effect twice. Loading is not safe to run
     * twice, because reading unreadable data sets it aside, so the second run
     * would find nothing saved and hand out the example lists instead. The ref
     * is what makes the second run do nothing.
     */
    const loadHasStarted = useRef(false);
    useEffect(() => {
        if (loadHasStarted.current) return;
        loadHasStarted.current = true;

        async function load() {
            if (!storage.isAvailable()) {
                canSave.current = false;
                inform({
                    title: 'Nothing Can Be Saved',
                    message: 'This browser is not allowing Wolfie Lists to use local storage, which may be because it is in a private browsing mode. You can still work, but nothing will be here when you come back.'
                });
                setIsLoaded(true);
                return;
            }

            // asked before loading, because loading unreadable data sets it aside
            const isFirstVisit = !storage.hasSavedData();
            let loaded = [];

            try {
                loaded = isFirstVisit ? await storage.loadStarterLists() : storage.loadLists();
            } catch (error) {
                inform(isFirstVisit
                    ? {
                        title: 'Example Lists Could Not Be Loaded',
                        message: `Wolfie Lists could not read its example lists, so it has started empty. Press the + button to make a list of your own. (${error.message})`
                    }
                    : { title: 'Saved Lists Could Not Be Loaded', message: error.message });
            }

            setLists(loaded);
            setIsLoaded(true);
        }

        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // save whenever the lists change, but not before they have been loaded
    useEffect(() => {
        if (!isLoaded || !canSave.current) return;
        try {
            storage.saveLists(lists);
        } catch (error) {
            inform({ title: 'Changes Were Not Saved', message: error.message });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lists, isLoaded]);

    function createList() {
        const created = createWolfieList({ name: buildUnusedName(lists, DEFAULT_LIST_NAME) });
        setLists([...lists, created]);
        setListNeedingNameFocus(created.id);
        return created;
    }

    function deleteList(listId) {
        setLists(lists.filter((list) => list.id !== listId));
        if (currentListId === listId) setCurrentListId(null);
    }

    /**
     * The one way to change a list's contents. updater is given the list and
     * returns its new version. It uses the functional form of setLists, so it
     * works on the latest lists even when a transaction runs long after it was
     * created.
     */
    function updateList(listId, updater) {
        setLists((previous) => previous.map((list) => list.id === listId ? updater(list) : list));
    }

    const value = {
        lists,
        isLoaded,
        currentListId,
        currentList: lists.find((list) => list.id === currentListId) ?? null,
        listNeedingNameFocus,
        openList: (listId) => setCurrentListId(listId),
        closeList: () => setCurrentListId(null),
        createList,
        deleteList,
        updateList,
        clearNameFocusRequest: () => setListNeedingNameFocus(null)
    };

    return <ListsContext.Provider value={value}>{children}</ListsContext.Provider>;
}
