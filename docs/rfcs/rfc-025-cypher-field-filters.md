# Cypher field filters

## Problem

Currently, `@cypher` fields are evaluated in the `RETURN` statement using `apoc.cypher.runFirstColumnSingle`.

For this reason, it's not possible to use these fields during filtering 
some good reason why this is needed could be found in issues:
- [#1997](https://github.com/neo4j/graphql/issues/1997).
- [#554](https://github.com/neo4j/graphql/issues/554).

For instance, given the following typeDefs:

```graphql
type Author {
    name: String
    mostRecentBook: Book
        @cypher(statement: "MATCH (this)-[:AUTHORED_BOOK]->(b:Book) RETURN b ORDER BY b.year DESC LIMIT 1")
    lastPublishedYear: Int
        @cypher(statement: "MATCH (this)-[:AUTHORED_BOOK]->(b:Book) RETURN b.year ORDER BY b.year DESC LIMIT 1")
    books: [Book!]! @relationship(type: "AUTHORED_BOOK", direction: OUT)
}

type Book {
    name: String!
    year: Int
    soldCopies: @cypher(statement: "OPTIONAL MATCH (this)<-[:SOLD]-(s:Sales) RETURN count(this)")
    authors: [Author!]! @relationship(type: "AUTHORED_BOOK", direction: IN)
}

type Sales {
    price: Int
    date: DateTime @DateTime()
}
```

The following GraphQL query:

```graphql
query Authors {
    authors {
        lastPublishedYear
    }
}
```

will generate a Cypher Query similar to:

```cypher
MATCH (this:`Author`)
RETURN this {
  lastPublishedYear: apoc.cypher.runFirstColumnSingle("MATCH (this)-[:AUTHORED_BOOK]->(b:Book) RETURN b.year ORDER BY b.year DESC LIMIT 1",
  { this: this })
} as this
```

The current library behavior makes it not possible to filter an Author based on the property `lastPublishedYear` as the property is evaluated only in the `RETURN` statement.

## Experimental Solution

This solution rely on the rfc-028-cypher-directive-subquery alternative `columnName` solution,
Changing the typeDefinition in compliance with the rfc-028 as:

```graphql
type Author {
    name: String
    mostRecentBook: Book
        @cypher(statement: "MATCH (this)-[:AUTHORED_BOOK]->(b:Book) RETURN b ORDER BY b.year DESC LIMIT 1")
    lastPublishedYear: Int
        @cypher(statement: "MATCH (this)-[:AUTHORED_BOOK]->(b:Book) RETURN b.year ORDER BY b.year DESC LIMIT 1")
    books: [Book!]! @relationship(type: "AUTHORED_BOOK", direction: OUT)
}

type Book {
    name: String!
    year: Int
    soldCopies: @cypher(statement: "OPTIONAL MATCH (this)<-[:SOLD]-(s:Sales) RETURN count(this)")
    authors: [Author!]! @relationship(type: "AUTHORED_BOOK", direction: IN)
}

type Sales {
    price: Int
}
```
The following GraphQL query:

```graphql
query Authors {
  authors(where: {
    name: "Simone"
  }) {
    name
    lastPublishedYear
  }
}
```

produces:

```cypher
MATCH (this:`Author`)
WHERE this.name = "Simone"
CALL {
    WITH this
    CALL {
        WITH this
        MATCH (this)-[:AUTHORED_BOOK]->(b:Book) RETURN b.year AS result ORDER BY b.year DESC LIMIT 1
    }
    UNWIND result AS this_lastPublishedYear
    
    RETURN head(collect(this_lastPublishedYear)) AS this_lastPublishedYear
}
RETURN this { .name, lastPublishedYear: this_lastPublishedYear } AS this
```

There are some considerations to do to support filtering on the field `lastPublishedYear`:

- Currently `@cypher` fields are computed only when these are present in the `SelectionSet` this has to be changed to support filtering,
as they need to be computed also for filters.
- The `WHERE` statement cannot be applied directly after the `CALL` statement, but instead should be applied to an extra `WITH` statement.
- It will be no possible to apply the filter separately as it will translated logically to an `AND` predicates between `@cypher` fields and not.








## No Experimental Solution

This RFC proposes to support filtering on scalar fields evaluated with the directive `@cypher`.

To make `@cypher` fields filterable, multiple steps are described in this solution.

### Schema Generation

To make the filter available to the GraphQL users, filters for `@cypher` fields have to be included in the GraphQL schema in the following types:

-   `AuthorWhere`
-   `BookAuthorsNodeAggregationWhereInput`

### Cypher Generation

`@cypher` fields have to be treated differently when filtered.

For instance, if for a not `@cypher` field a filter is applied as follow:

```cypher
WHERE this.property = value
```

For a `@cypher` field it has to be changed in:

```cypher
WHERE apoc.cypher.runFirstColumnSingle("USER DEFINED CYPHER") = value
```

This is because the `@cypher` property does not exist in the physical `Node`.

### Usage Examples

For comparison, let's consider the case where we want to select all the Authors with the name `John`:

```graphql
query Authors {
    authors(where: { name: "John" }) {
        name
    }
}
```

The Cypher generated will look like this:

```cypher
MATCH (this:`Author`)
WHERE this.name = "John"
RETURN this { .name } as this
```

Now consider the case where we want to select all the Authors that have published something in `2021`:

```graphql
query Authors {
    authors(where: { lastPublishedYear: 2021 }) {
        name
        lastPublishedYear
    }
}
```

As the `lastPublishedYear` is not a real property of the `Node`, this RFC proposes to generate a new Cypher that looks like:

```cypher
MATCH (this:`Author`)
WHERE apoc.cypher.runFirstColumnSingle("MATCH (this)-[:AUTHORED_BOOK]->(b:Book) RETURN b.year ORDER BY b.year DESC LIMIT 1", { this: this }) = 2021
RETURN this {
    .name,
    lastPublishedYear: apoc.cypher.runFirstColumnSingle("MATCH (this)-[:AUTHORED_BOOK]->(b:Book) RETURN b.year ORDER BY b.year DESC LIMIT 1", { this: this })
} as this
```

## Risks

-   Redundant evaluation, the `@cypher` fields may be evaluated multiple times for the same `Node` in the same Query.
-   Performance issues.
-   Refactoring without using `runFirstColumn` may be difficult.

## Security consideration

-   None.

## Out of Scope

-   Non-scalar property.
-   Remove `runFirstColumn`.
