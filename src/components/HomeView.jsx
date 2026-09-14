/**
 * HomeView.jsx
 *
 * The screen the user lands on: the Wolfie header, a scrollable container of
 * cards one per list, and the + button that makes a new one.
 *
 * WHAT THIS COMPONENT STILL DOES NOT DO
 * -------------------------------------
 * The same thing HW1's HomeView did not do. It never deletes a list, it never
 * creates one, it never touches local storage. It reports what the user did and
 * it draws. Every one of the handlers below is a call into ListsContext.
 */
import { useLists } from '../context/ListsContext.jsx';
import { useModals } from '../context/ModalContext.jsx';
import Fab from './Fab.jsx';
import ListCard from './ListCard.jsx';

export default function HomeView() {
    const { lists, openList, createList, deleteList } = useLists();
    const { askConfirm } = useModals();

    /**
     * A brand new list opens straight away with its name selected, so that naming
     * it is simply the next thing the user types. ListView does the selecting;
     * see the autoFocus note there.
     */
    function handleCreateList() {
        const created = createList();
        if (created !== null) openList(created.id);
    }

    /**
     * Deleting a whole list is not undoable — the transaction stack covers edits
     * made inside a list — so the warning modal says so plainly.
     */
    function handleDeleteList(list) {
        askConfirm({
            title: 'Delete This List?',
            message: `The list named "${list.name}" and everything in it will be permanently deleted. Deleting a list cannot be undone.`,
            acceptLabel: 'Delete List',
            onAccept: () => deleteList(list.id)
        });
    }

    const isEmpty = lists.length === 0;

    return (
        <section className="flex min-h-0 flex-1 flex-col" aria-label="Home">
            <header className="flex items-center justify-center gap-4 bg-sbu-red px-6 py-5
                               text-sbu-white shadow-bar max-[46rem]:gap-3 max-[46rem]:p-4">
                {/*
                    alt is deliberately empty. The logo sits immediately beside the
                    words "Wolfie Lists", so giving it alt text would make a screen
                    reader announce the same thing twice. An empty alt is how you
                    say "this image is decoration", which is different from
                    omitting the attribute entirely.

                    width and height carry the image's real pixel dimensions even
                    though the classes size it. The browser uses them to work out
                    the aspect ratio and reserve the space before the file has
                    loaded, so the title does not jump sideways on a slow
                    connection.
                */}
                <img
                    className="h-16 w-auto drop-shadow-[0_0.125rem_0.25rem_rgba(0,0,0,0.35)]
                               max-[46rem]:h-[2.875rem]"
                    src="/images/wolfie-logo.png" alt="" width="1464" height="1054" />
                <h1 className="m-0 font-script text-[3.5rem] leading-[1.1] font-normal
                               tracking-[0.03em] [text-shadow:0_0.125rem_0.25rem_rgba(0,0,0,0.35)]
                               max-[46rem]:text-[2.5rem]">
                    Wolfie Lists
                </h1>
            </header>

            <div className="relative flex min-h-0 flex-1 flex-col px-6 pt-5 max-[46rem]:px-3.5 max-[46rem]:pt-4">
                {isEmpty ? (
                    <p id="home-empty-message"
                       className="m-auto pb-16 text-center text-[1.0625rem] text-grey-500">
                        You do not have any lists yet.<br />
                        Press the <strong>+</strong> button to make your first one.
                    </p>
                ) : (
                    <ul
                        id="list-card-container"
                        aria-label="Your lists"
                        className="card-container card-scroll m-0 min-h-0 flex-1 list-none
                                   overflow-x-hidden overflow-y-auto pt-0.5 pr-2 pb-22 pl-0.5">
                        {lists.map((list, index) => (
                            <ListCard
                                key={list.id}
                                list={list}
                                index={index}
                                onOpen={() => openList(list.id)}
                                onDelete={() => handleDeleteList(list)} />
                        ))}
                    </ul>
                )}

                <Fab id="add-list-button" label="Create a new list" onClick={handleCreateList} />
            </div>
        </section>
    );
}
