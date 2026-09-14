/**
 * ModalLayer.jsx
 *
 * Renders whichever modals are currently open.
 *
 * All three sit here, outside #app, so that no layout rule meant for a screen
 * can reach them — the same reason HW1 put them outside #app in index.html.
 *
 * WHY THE ITEM MODAL IS ONLY RENDERED INSIDE A LIST
 * ------------------------------------------------
 * It reaches for useListEditor, which reaches for CurrentListContext, which only
 * exists while a list is open. Rendering it on the home screen would throw. That
 * is the tree enforcing something HW1 could only hope for: in HW1 the ItemModal
 * object existed from startup, and opening it with no list open was a runtime
 * mistake guarded by a null check in the controller.
 *
 * WHY THE key ON ItemModal
 * ------------------------
 * The item modal holds the five fields in state, seeded once from the values it
 * was opened with. Pressing Next asks the editor to open the modal again on a
 * different item, which changes the props but would NOT reseed that state —
 * React reuses a component instance when it appears in the same place in the
 * tree, and initial state is only initial once. The result would be pressing
 * Next and watching the previous item's text stay on screen.
 *
 * Giving it a key that changes when the item does makes React throw the old
 * instance away and build a new one, which reseeds the form. This is the
 * standard answer to "reset a component's state when its subject changes", and
 * it is worth knowing precisely because the bug it fixes is invisible until
 * somebody presses Next.
 */
import { useLists } from '../../context/ListsContext.jsx';
import { useModals } from '../../context/ModalContext.jsx';
import AlertModal from './AlertModal.jsx';
import ConfirmModal from './ConfirmModal.jsx';
import ItemModal from './ItemModal.jsx';

/**
 * The two modals that can be shown from anywhere. Rendered by App, once, beside
 * the screens rather than inside them, so that closing a list cannot take an
 * open warning modal down with it.
 */
export default function ModalLayer() {
    return (
        <>
            <ConfirmModal />
            <AlertModal />
        </>
    );
}

/**
 * The item modal, which is a different matter: it edits the open list, so it is
 * rendered by CurrentScreen inside CurrentListProvider and simply does not exist
 * when no list is open.
 *
 * HW1 could not express that. Its ItemModal object was built at startup and
 * lived for the whole session whether a list was open or not, so "open the item
 * modal with no list open" was a runtime mistake that had to be guarded against
 * with a null check in the controller. Here it is not a mistake that can be
 * made.
 */
export function ItemModalHost() {
    const { itemModal } = useModals();
    const { currentListId } = useLists();

    if (itemModal === null || currentListId === null) return null;

    return <ItemModal key={`${currentListId}:${itemModal.mode}:${itemModal.index}`} />;
}
