# Wolfie Lists — CSE 316 Homework 2

The Wolfie Lists application from HW1, rebuilt in React with functional
components, hooks and context, and styled with Tailwind. It is still front end
only: everything is saved to the browser's local storage.

You are given a partly built application. Your job is to finish it. You have the
HW1 solution as well, and you are welcome to look at anything in it.

---

## Running it

```
npm install       # React, Tailwind and Vite. The application will not run without them
npm start         # then open http://localhost:9000
npm test          # the unit and integration tests
npm run test:e2e  # the end-to-end tests, in a real Chrome
```

The application runs on a fresh checkout. The home screen works — your lists are
there, you can open one, delete one and make a new one — but an opened list shows
two hard coded rows instead of its own items, and a good deal of the list screen
is missing.

---

## The tests are the specification

The whole test suite ships with this project, and it describes the finished
application: every function the tests call, every button's accessible name and
every label on the item modal.

```
npm test
npm run test:e2e
```

On a fresh checkout many of the tests fail. **Making them pass is the
assignment.** When `npm test` and `npm run test:e2e` are both green, you are done.

The end-to-end tests drive the Google Chrome already installed on your machine
rather than downloading their own copy. If Playwright says it cannot find a
browser, run `npx playwright install chromium` and delete the `channel: 'chrome'`
line in `tests/playwright.config.js`.

---

## You will not write any CSS

Everything in this assignment is styled with Tailwind utility classes written in
the components themselves, and `src/css/wolfie_lists.css` already holds every
color, shadow, radius and grid rule the finished application uses. Do not edit
it. Every Tailwind class you need can be learned by looking at the components you
have been given — `ListCard.jsx`, the hard coded rows in `ListView.jsx`,
`ItemModal.jsx` and `Modal.jsx` — together with the color names declared in the
`@theme` block at the top of the stylesheet, such as `bg-priority-high` and
`text-completed-mark`.

---

## What you have to build

### 1. `ItemCard.jsx`

`ListView.jsx` does not look at the open list's items at all. It draws two hard
coded rows, *Hard Coded Task 1 Description* and *Hard Coded Task 2 Description*,
each with a date of 01/01/1970.

Create `src/components/ItemCard.jsx`, a component that draws one item, and change
`ListView` so that it goes through all of the list's items and produces an
`ItemCard` for each one. `ListCard.jsx` and the way `HomeView` goes through the
lists are the finished version of the same idea for the home screen. Read them
first.

A card shows the item's description, date entered, priority, target date (an em
dash when there is none — see `DateUtil.format`) and a tick in the Completed
column when the item is done, with the description struck through. It carries a
duplicate button and a delete button on the right; `IconButton.jsx` is already
written for this. Clicking a card, or pressing Enter on it, opens the item modal
through `requestEditItem`. The card is also draggable: the drag and drop code is
already in `ListView`, waiting for cards to use `handleDragStart` and `endDrag`.

When a list has no items, `ListView` should say *This list is empty* instead of
drawing the column headers.

### 2. The missing fields on an item

An item currently holds only an id, a description and a date entered. Add three
more in `src/model/listItem.js`: `priority`, `targetDate` and `completed`, both in
`createListItem` and in `itemFromJSON`.

A priority is one of exactly three values — High, Medium and Low, in that order
wherever the user is offered the choice — and anything else, or nothing at all,
means Low. How you arrange that vocabulary is up to you. What you should avoid is
the string "High" scattered through a dozen files. A new item has no target date
and is not completed.

`countCompleted` in `wolfieList.js` already counts completed items, so the
*"0 of 3 completed"* on each home screen card starts telling the truth as soon as
items know whether they are completed.

### 3. The item modal

The modal opens on an existing item and carries Description, Date Entered, Next,
Cancel and OK. Add:

- **a Previous button**, the mirror of Next, disabled on the first item. The
  button is missing, and so is `commitItemModal`'s response to
  `then === 'previous'`.
- **a Priority drop down, and a Target Date section** with the date control on
  the left and a Completed checkbox beside it. The two are independent: a target
  date says when an item is meant to be finished, the checkbox says whether it
  is.

### 4. Deleting an item

Nothing for this exists. Add the delete button to `ItemCard`, a
`requestDeleteItem(index)` function to `useListEditor`, and a
`DeleteItem_Transaction`. Deleting an item is guarded by the warning modal first,
and **is** undoable. `HomeView` already deletes a whole list through the same
warning modal, and `DuplicateItem_Transaction` is the closest example of a
transaction that removes an item on undo.

### 5. Adding an item

Also missing entirely: the **+** button in the list view, `requestAddItem()` in
`useListEditor`, `AddItem_Transaction`, and a create mode for the item modal.
Extend the existing `ItemModal` rather than writing a second one. In create mode
its heading reads *New Item*, its OK button reads *Add*, and Previous and Next are
disabled. The item only comes into existence once Add is pressed, it goes at the
end of the list, and adding it is undoable. The home screen's **+** button is the
example to follow for the button itself.

### 6. Duplicating a list

A home screen card has a delete button but no duplicate button. Add the button to
`ListCard`, and a `duplicateList(listId)` function to `ListsContext` for it to
call. The copy is filed directly beneath the original, is named after it with
*(Copy)* on the end — or the next name that is not already taken — and is not
opened. Duplicating a list is **not** undoable, just like creating and deleting a
list.

### 7. Undo for moving an item and renaming the list

Dragging an item to a new position and renaming the list both work, but neither
can be undone: `moveItem` and `renameList` in `useListEditor` change the list
directly. Write a `MoveItem_Transaction` and a `RenameList_Transaction`, and change
those two functions to go through the transaction stack instead.
`src/transactions/README-transactions.md` explains how a transaction works in this
version of the application.

---

## The names your code has to use

The tests find things by name, so these must be spelled exactly as they appear
here. Everything else — your file structure beyond these, your wording
elsewhere, your helper functions — is yours.

**Functions the tests call**

| Where | Function |
|---|---|
| `useListEditor` | `requestAddItem()` |
| `useListEditor` | `requestDeleteItem(index)` |
| `useListEditor` | `commitItemModal({ mode, index, values, then })`, where `mode` is `'create'` or `'edit'` and `then` is `'close'`, `'next'` or `'previous'` |

**Item cards**

| What | Name |
|---|---|
| the card's accessible name | `Edit the item <description>`, with `, completed` on the end for a completed item |
| the card element | carries the class `item-card` and a `data-index` attribute, which the drag and drop code reads |
| the description | inside an element with the class `item-description` |
| the duplicate button | `Duplicate the item <description>` |
| the delete button | `Delete the item <description>` |

**Buttons and modals**

| What | Name |
|---|---|
| the **+** button in the list view | `Add a new item` |
| the duplicate button on a list card | `Duplicate the list named <name>` |
| the warning modal for deleting an item | titled `Delete This Item?`, its message says the user *can undo this*, and its button reads `Delete Item` |
| the item modal's new controls | labelled `Priority` and `Completed`, and a target date control labelled *The date this item is meant to be finished by* |
| the Priority control | a `<select>` whose option values are `High`, `Medium` and `Low` |
| the target date control | an `<input type="date">`, like the Date Entered control beside it |
| a completed item's card | shows `✓` in the Completed column |
| the item modal in create mode | heading `New Item`, button `Add` |

---

## What you have been given

| Provided | |
|---|---|
| `src/App.jsx`, `src/main.jsx` | the component tree and the entry point |
| `src/components/` | `HomeView`, `ListCard`, `ListView`, `Fab`, `IconButton`, and all of the modals |
| `src/context/` | `ListsContext`, `CurrentListContext`, `ModalContext` |
| `src/hooks/` | `useListEditor`, `useUndoRedoShortcuts` |
| `src/model/` | `listItem.js`, `wolfieList.js` |
| `src/transactions/` | `DuplicateItem_Transaction`, `EditItem_Transaction` |
| `src/data/`, `src/common/`, `src/lib/jsTPS.js` | storage, dates, ids, and the undo/redo library |
| `src/css/wolfie_lists.css` | the Tailwind theme and the few rules utilities cannot express |

The jsTPS library employs the Command design pattern, and each transaction is used
as a command: an undoable action packaged as an object with `doTransaction()` and
`undoTransaction()`.

---

## How the code is arranged

```
index.html                    an empty <div id="root">, and nothing else
public/
  data/starter_lists.json     the example lists given to a new browser
  images/                     the Wolfie logo
src/
  main.jsx                    renders App
  App.jsx                     the providers, and which screen is showing
  components/                 what the user sees
  context/                    the application's shared state
  hooks/                      what the list screen can do
  model/                      plain objects, and functions that return new ones
  transactions/               one class per kind of undoable edit
  data/                       local storage and the example lists
  common/                     dates and ids
  lib/jsTPS.js                the undo/redo library
  css/wolfie_lists.css        the Tailwind theme
tests/
  unit/                       one module, alone
  integration/                components and contexts together, in jsdom
  e2e/                        the whole application, in a real Chrome
```

**Two rules the design depends on.**

1. **Nothing changes a list or an item in place.** Every function in `src/model`
   returns a new object, because React only redraws when it is handed a different
   one. A list changed in place looks unchanged, and nothing on screen updates.
2. **Every edit made inside a list goes through jsTPS**, so it can be undone.
   Creating, duplicating and deleting a whole *list* is deliberately not undoable.
