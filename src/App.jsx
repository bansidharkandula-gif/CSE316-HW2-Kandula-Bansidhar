/**
 * App.jsx
 *
 * The whole application in one screenful, which is the point of reading it.
 *
 * HW1's main.js built six objects and then wired them to each other by hand:
 * every view subscribed to the model, the controller subscribed to every view,
 * and the order those subscriptions happened in mattered, because a
 * LISTS_CHANGED sent before anyone was listening simply vanished. Getting that
 * wrong produced a screen that drew once and then never updated again.
 *
 * The tree below says the same thing, but it says it structurally. A component
 * can reach a context if and only if it is inside that context's Provider, so
 * the nesting IS the wiring, there is no order to get wrong, and a component
 * that reaches for something it is not inside of throws a readable error the
 * first time it renders rather than going quiet.
 *
 * WHY ModalProvider IS OUTERMOST
 * ------------------------------
 * Because ListsProvider needs it. Loading is where storage can fail, and the
 * only thing to do about a failure is tell the user through the informative
 * modal — so ListsProvider calls useModals, and must therefore sit inside
 * ModalProvider. Reversing these two is the one nesting mistake this file can
 * make, and it fails immediately with the message from useModals.
 *
 * WHY CurrentListProvider IS INSIDE THE CONDITIONAL
 * ------------------------------------------------
 * This is the part worth stopping on. It is mounted only while a list is open,
 * which means the jsTPS transaction stack it holds is created when a list opens
 * and destroyed when it closes.
 *
 * HW1 achieved that by calling clearAllTransactions() in openList and again in
 * closeCurrentList, and if you forgot either one, undo would happily reach back
 * into a list the user had already left. Here there is nothing to remember. The
 * stack cannot outlive the list because it does not exist without one.
 */
import { ListsProvider, useLists } from './context/ListsContext.jsx';
import { CurrentListProvider } from './context/CurrentListContext.jsx';
import { ModalProvider } from './context/ModalContext.jsx';
import HomeView from './components/HomeView.jsx';
import ListView from './components/ListView.jsx';
import ModalLayer, { ItemModalHost } from './components/modals/ModalLayer.jsx';

/**
 * Home screen or list screen.
 *
 * ROUTING, OR RATHER THE ABSENCE OF IT. Which screen is showing is a piece of
 * state, not a url. That is a deliberate choice and not laziness: this
 * application has no addresses worth sharing or bookmarking, and React Router is
 * a large idea that HW3 can introduce on its own terms rather than one smuggled
 * in here to solve a problem nobody has yet.
 *
 * Note that the two screens are not both mounted with one hidden, which is what
 * HW1 did with a .hidden class. Only one of them exists at a time. That is why
 * neither screen needs a show() or a hide() method, and why the list screen
 * cannot hold stale state from the last list that was open.
 */
function CurrentScreen() {
    const { currentListId } = useLists();

    if (currentListId === null) {
        return <HomeView />;
    }

    return (
        <CurrentListProvider>
            <ListView />
            <ItemModalHost />
        </CurrentListProvider>
    );
}

export default function App() {
    return (
        <ModalProvider>
            <ListsProvider>
                <div id="app" className="flex h-screen flex-col">
                    <CurrentScreen />
                </div>
                <ModalLayer />
            </ListsProvider>
        </ModalProvider>
    );
}
