// @vitest-environment jsdom
/**
 * HomeView.test.jsx
 *
 * The home screen, driven the way a user drives it: by finding controls the way
 * a user would find them and clicking them.
 *
 * WHY THE QUERIES LOOK LIKE THIS
 * ------------------------------
 * getByRole('button', { name: 'Delete the list named Chores' }) rather than
 * querySelector('[data-action="delete-list"]').
 *
 * That is not a stylistic preference. A test written the first way fails if the
 * button loses its accessible name, which is a real bug for anybody using a
 * screen reader and one that no amount of clicking would ever reveal. A test
 * written the second way passes happily with an unlabelled button. The queries
 * are the accessibility check, taken for free.
 *
 * HW1's tests could not do this, because there was no library for it; they
 * reached for ids and classes and then asserted on aria-label separately.
 */
import { screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { renderApp, resetStorage } from '../helpers/harness.jsx';
import { CHORES_LIST, EMPTY_LIST, readStorage, WEEKEND_LIST } from '../helpers/fixtures.js';

beforeEach(resetStorage);

/** every list card on screen, in the order they are drawn */
const listCards = () => screen.getAllByRole('button', { name: /^Open the list named/ });

describe('drawing the lists', () => {
    it('shows one card per list, in order', async () => {
        renderApp({ lists: [WEEKEND_LIST, CHORES_LIST] });

        await waitFor(() => expect(listCards()).toHaveLength(2));
        expect(listCards()[0]).toHaveTextContent("Wolfie's Weekend");
        expect(listCards()[1]).toHaveTextContent('Chores');
    });

    it('says how much of each list is done', async () => {
        renderApp({ lists: [WEEKEND_LIST] });

        // one of the three weekend items is completed
        await screen.findByText('1 of 3 completed');
    });

    it('says so plainly when a list has no items at all', async () => {
        renderApp({ lists: [EMPTY_LIST] });
        await screen.findByText('No items yet');
    });

    it('invites the user to start when there are no lists', async () => {
        renderApp({ lists: [] });
        await screen.findByText(/do not have any lists yet/i);
    });

    it('does not show the empty message once a list exists', async () => {
        renderApp({ lists: [WEEKEND_LIST] });

        await waitFor(() => expect(listCards()).toHaveLength(1));
        expect(screen.queryByText(/do not have any lists yet/i)).not.toBeInTheDocument();
    });
});

describe('opening a list', () => {
    it('goes to the list screen when a card is clicked', async () => {
        const { user } = renderApp({ lists: [WEEKEND_LIST] });

        await user.click(await screen.findByRole('button', { name: /Open the list named Wolfie/ }));

        expect(await screen.findByLabelText('The name of this list'))
            .toHaveValue("Wolfie's Weekend");
    });

    it('opens on Enter as well as on a click, since a card is focusable', async () => {
        const { user } = renderApp({ lists: [WEEKEND_LIST] });

        const card = await screen.findByRole('button', { name: /Open the list named Wolfie/ });
        card.focus();
        await user.keyboard('{Enter}');

        expect(await screen.findByLabelText('The name of this list')).toBeInTheDocument();
    });
});

describe('creating a list', () => {
    it('makes a list and opens it straight away', async () => {
        const { user } = renderApp({ lists: [] });
        await screen.findByText(/do not have any lists yet/i);

        await user.click(screen.getByRole('button', { name: 'Create a new list' }));

        expect(await screen.findByLabelText('The name of this list'))
            .toHaveValue('Untitled List');
    });

    /**
     * Naming a new list should be simply the next thing the user types, which is
     * what HW1 achieved by calling focusNameInput() from the controller.
     */
    it('puts the caret in the name field with the name selected', async () => {
        const { user } = renderApp({ lists: [] });
        await screen.findByText(/do not have any lists yet/i);

        await user.click(screen.getByRole('button', { name: 'Create a new list' }));

        const nameInput = await screen.findByLabelText('The name of this list');
        await waitFor(() => expect(nameInput).toHaveFocus());
        expect(nameInput.selectionStart).toBe(0);
        expect(nameInput.selectionEnd).toBe('Untitled List'.length);
    });

    it('does not reuse a name that is already taken', async () => {
        const { user } = renderApp({ lists: [] });
        await screen.findByText(/do not have any lists yet/i);

        await user.click(screen.getByRole('button', { name: 'Create a new list' }));
        await screen.findByLabelText('The name of this list');
        await user.click(screen.getByRole('button', { name: 'Close this list' }));

        await user.click(await screen.findByRole('button', { name: 'Create a new list' }));

        expect(await screen.findByLabelText('The name of this list'))
            .toHaveValue('Untitled List 2');
    });
});

describe('duplicating a list', () => {
    it('files the copy directly beneath the original', async () => {
        const { user } = renderApp({ lists: [WEEKEND_LIST, CHORES_LIST] });
        await waitFor(() => expect(listCards()).toHaveLength(2));

        await user.click(screen.getByRole('button',
            { name: "Duplicate the list named Wolfie's Weekend" }));

        await waitFor(() => expect(listCards()).toHaveLength(3));
        expect(listCards()[1]).toHaveTextContent("Wolfie's Weekend (Copy)");
        expect(listCards()[2]).toHaveTextContent('Chores');
    });

    it('copies the items too', async () => {
        const { user } = renderApp({ lists: [WEEKEND_LIST] });
        await waitFor(() => expect(listCards()).toHaveLength(1));

        await user.click(screen.getByRole('button',
            { name: "Duplicate the list named Wolfie's Weekend" }));

        await waitFor(() => expect(listCards()).toHaveLength(2));
        expect(within(listCards()[1]).getByText('1 of 3 completed')).toBeInTheDocument();
    });

    it('does not open the list it was asked to duplicate', async () => {
        const { user } = renderApp({ lists: [WEEKEND_LIST] });
        await waitFor(() => expect(listCards()).toHaveLength(1));

        await user.click(screen.getByRole('button',
            { name: "Duplicate the list named Wolfie's Weekend" }));

        await waitFor(() => expect(listCards()).toHaveLength(2));
        expect(screen.queryByLabelText('The name of this list')).not.toBeInTheDocument();
    });
});

describe('deleting a list', () => {
    it('asks first, and says that it cannot be undone', async () => {
        const { user } = renderApp({ lists: [WEEKEND_LIST] });
        await waitFor(() => expect(listCards()).toHaveLength(1));

        await user.click(screen.getByRole('button',
            { name: "Delete the list named Wolfie's Weekend" }));

        expect(await screen.findByText('Delete This List?')).toBeInTheDocument();
        expect(screen.getByText(/cannot be undone/i)).toBeInTheDocument();
        // and nothing has actually happened yet
        expect(listCards()).toHaveLength(1);
    });

    it('deletes it once the warning is accepted', async () => {
        const { user } = renderApp({ lists: [WEEKEND_LIST, CHORES_LIST] });
        await waitFor(() => expect(listCards()).toHaveLength(2));

        await user.click(screen.getByRole('button',
            { name: "Delete the list named Wolfie's Weekend" }));
        await user.click(await screen.findByRole('button', { name: 'Delete List' }));

        await waitFor(() => expect(listCards()).toHaveLength(1));
        expect(listCards()[0]).toHaveTextContent('Chores');
    });

    it('leaves it alone if the warning is declined', async () => {
        const { user } = renderApp({ lists: [WEEKEND_LIST] });
        await waitFor(() => expect(listCards()).toHaveLength(1));

        await user.click(screen.getByRole('button',
            { name: "Delete the list named Wolfie's Weekend" }));
        await user.click(await screen.findByRole('button', { name: 'Cancel' }));

        await waitFor(() =>
            expect(screen.queryByText('Delete This List?')).not.toBeInTheDocument());
        expect(listCards()).toHaveLength(1);
    });

    /**
     * A user who deletes their last list has saved an empty collection. They
     * must not be handed the example lists back on the next visit, which is what
     * would happen if deleting cleared the storage key rather than writing an
     * empty list of lists to it.
     */
    it('writes an empty collection rather than clearing storage', async () => {
        const { user } = renderApp({ lists: [WEEKEND_LIST] });
        await waitFor(() => expect(listCards()).toHaveLength(1));

        await user.click(screen.getByRole('button',
            { name: "Delete the list named Wolfie's Weekend" }));
        await user.click(await screen.findByRole('button', { name: 'Delete List' }));

        await waitFor(() => expect(readStorage()).toEqual([]));
    });
});

describe('the buttons on a card', () => {
    /**
     * The two buttons live inside a card that is itself clickable, so without
     * stopPropagation pressing delete would also open the thing being deleted.
     */
    it('do not also open the list', async () => {
        const { user } = renderApp({ lists: [WEEKEND_LIST] });
        await waitFor(() => expect(listCards()).toHaveLength(1));

        await user.click(screen.getByRole('button',
            { name: "Delete the list named Wolfie's Weekend" }));

        await screen.findByText('Delete This List?');
        expect(screen.queryByLabelText('The name of this list')).not.toBeInTheDocument();
    });
});

describe('what a screen reader is told', () => {
    it('gives every card and every button an accessible name', async () => {
        renderApp({ lists: [CHORES_LIST] });

        expect(await screen.findByRole('button', { name: 'Open the list named Chores' }))
            .toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Duplicate the list named Chores' }))
            .toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Delete the list named Chores' }))
            .toBeInTheDocument();
    });

    it('does not make a screen reader read the logo as well as the title', async () => {
        renderApp({ lists: [CHORES_LIST] });
        await screen.findByRole('button', { name: 'Open the list named Chores' });

        // an empty alt is how you say "this image is decoration"
        expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });
});
