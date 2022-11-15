# OGM Select

Steps toward making the OGM a TypeSafe client

## Problem

When using the OGM you have to use the `selectionSet` to select subfields of the Graph like so:

```js
ogm.model("Movie").findMany({
    selectionSet: `
        {
            id
            title
            genres {
                id
                name
            }
        }
    `,
});
```

This is cumbersome because:

1. You need to use a string - harder to manipulate
2. It's not TypeSafe and you only know of errors(wrong queries) at runtime
3. DX is poor because you don't know what you can query

## Proposed Solution

Introducing the `select` object:

```js
ogm.model("Movie").findMany({
    select: {
        id: true,
        title: true,
        genres: {
            select: {
                id: true,
                name: true,
            },
        },
    },
});
```

Allows you to select subfields of the Graph, in a TypeSafe way(Types should be generated for this)

### Where and Options

```js
ogm.model("Movie").findMany({
    select: {
        id: true,
        title: true,
        genres: {
            where?: {}, // <- Typesafe where argument
            options?: {}, // <- Typesafe where argument
            select: {
                id: true,
                name: true,
            },
        },
    },
});
```
