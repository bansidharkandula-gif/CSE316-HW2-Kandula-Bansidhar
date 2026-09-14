# The transactions folder

One class per kind of undoable edit, exactly as in HW1. What changed is not the pattern,
it is what a transaction is allowed to touch.

## The Command pattern, unchanged

Every class here extends `jsTPS_Transaction` and implements `doTransaction()`
and `undoTransaction()`. `jsTPS` holds them on a stack with a cursor; undo walks
the cursor backwards, redo walks it forwards. That is the Gang of Four Command
pattern, including the "history list" its own chapter describes, and none of it
changed when the user interface was rewritten. `src/lib/jsTPS.js` is byte for
byte the file HW1 used.

## What did change: transactions no longer reach into a model

In HW1 a transaction held the model and called methods that changed a list in
place:

```js
doTransaction() {
    this.#model.addItemToCurrentList(this.#copy, this.#index + 1);
}
```

React cannot see a change made that way. It decides whether to redraw by
comparing the state it has now against the state it had before with `===`, and
an object edited in place is `===` to itself.

So a transaction is now handed a small object of **operations** by
`CurrentListContext`, and each operation asks React for a new list:

```js
doTransaction() {
    this.#operations.addItem(this.#copy, this.#index + 1);
}
```

with, in `CurrentListContext`:

```js
addItem: (item, index) => change((list) => addItem(list, item, index)),
```

where `change` passes the update on to `updateList` in `ListsContext`:

```js
function updateList(listId, updater) {
    setLists((previous) => previous.map((list) => list.id === listId ? updater(list) : list));
}
```

Note the function passed to `setLists`. That is not a stylistic preference: a
transaction can be undone minutes after it was constructed, by which time any
list it had captured would be long stale. Asking React for the current value at
the moment of the change is the only version that is correct.

## Everything a transaction needs arrives through its constructor

There is a second consequence.

In HW1, `DeleteItem_Transaction` could hold the `ListItem` object it removed and
put that very object back on undo. `EditItem_Transaction` did already keep
before and after value snapshots — it was the one transaction that had to,
because an item edited in place is its own "before".

Now that lists and items are immutable, **every** transaction works that way. A
transaction captures everything it needs at the moment it is constructed and
never reads the model again. Look at either of the two here and you will find no reads
inside `doTransaction` or `undoTransaction` at all — only the values captured in
the constructor. Storing whatever is needed to reverse the action is part of what
makes each transaction a command.

## The two in this folder

| Transaction | What it keeps so it can be undone |
|---|---|
| `DuplicateItem_Transaction` | the copy, made once, so it keeps one stable id |
| `EditItem_Transaction` | the item's values before and after |
