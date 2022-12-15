# Cypher field filters

## Problem

Currently, `@cypher` fields are evaluated in the `RETURN` statement using `apoc.cypher.runFirstColumnSingle`.

For this reason, it's not possible to use these fields during filtering
some good reasons why this is needed could be found in the issues:

-   [#1997](https://github.com/neo4j/graphql/issues/1997).
-   [#554](https://github.com/neo4j/graphql/issues/554).

For instance, given the following typeDefs:

```graphql
type Author {
    name: String
    mostRecentBooks: [Book!]!
        @cypher(statement: "MATCH (this)-[:AUTHORED_BOOK]->(b:Book) RETURN b AS result ORDER BY b.year DESC LIMIT 5", columnName: "result")
    lastPublishedYear: Int
        @cypher(statement: "MATCH (this)-[:AUTHORED_BOOK]->(b:Book) RETURN b.year AS result ORDER BY b.year DESC LIMIT 1", columnName: "result")
    books: [Book!]! @relationship(type: "AUTHORED_BOOK", direction: OUT)
}

type Book {
    name: String!
    year: Int
    refID: ID @id
    soldCopies: @cypher(statement: "OPTIONAL MATCH(sales:Sales) WHERE this.refID = sales.refID WITH count(sales) AS result  RETURN result AS result ", columnName: "result")
    authors: [Author!]! @relationship(type: "AUTHORED_BOOK", direction: IN)
}

type Sales {
    refID: ID
    price: Int
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

This solution relies on the **rfc-028-cypher-directive-subquery** alternative `columnName` solution,

The following GraphQL query:

```graphql
query Authors {
    authors(where: { name: "Simone" }) {
        name
        lastPublishedYear
    }
}
```

Produces:

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

-   Currently, `@cypher` fields are computed only when these are present in the `SelectionSet`,
    this has to be changed to support filtering as they need to be computed also for filters.
-   The `@cypher` field needs to be computed separately and before the projections.
-   The `WHERE` statement cannot be applied directly after the `CALL` statement but instead should be applied to an extra `WITH` statement.
-   It will be no possibility to apply the filter separately as it will be translated logically to an `AND` predicates between `@cypher` fields and not.

Following this recommendation the new filter and Cypher should look like this:

**GraphQL**

```graphql
query Authors {
    authors(where: { name: "Simone", lastPublishedYear: 2022 }) {
        name
        lastPublishedYear
    }
}
```

**Cypher**

```cypher
MATCH (this:`Author`)
CALL {
    WITH this
    CALL {
        WITH this
        MATCH (this)-[:AUTHORED_BOOK]->(b:Book) RETURN b.year AS result ORDER BY b.year DESC LIMIT 1
    }
    UNWIND result AS this_lastPublishedYear
    RETURN head(collect(this_lastPublishedYear)) AS this_lastPublishedYear
}
WITH *
WHERE this.name = "Simone" AND this_lastPublishedYear = 2022
RETURN this { .name, lastPublishedYear: this_lastPublishedYear } AS this
```

For scalar fields, the previous predicate works fine, although for the no-scalar `@cypher` field more considerations are required.

### Nested @cypher filters

There are several filters available to no-scalar fields previously reserved to the `@relationship` field, this RFC wants to make these filters available to `@cypher` resolved fields.

#### SOME filter

The `_SOME` filter is based on the sub-clause `EXISTS`, this behavior has to be changed for `@cypher` resolved fields.

**GraphQL**

```graphql
{
    authors(where: { name: "Simone", mostRecentBooks_SOME: { name: "Simone's adventures!" } }) {
        name
        mostRecentBooks {
            name
            year
        }
    }
}
```

**Current mostRecentBooks predicate**

```cypher
EXISTS {
    MATCH (this)-[:AUTHORED_BOOK]->(this0:`Book`)
    WHERE this0.name = "Simone's adventures!"
})
```

As the `mostRecentBooks` is already resolved it's possible to filter it directly without the `EXISTS` sub-clause,
but by using the `any` predicate function as follow:

**Cypher Proposed**

```cypher
MATCH (this:`Author`)
CALL {
    WITH this
    CALL {
        WITH this
        MATCH (this)-[:AUTHORED_BOOK]->(b:Book) RETURN b AS result ORDER BY b.year DESC LIMIT 5
    }
    WITH result AS this_mostRecentBooks

    RETURN collect(this_mostRecentBooks { .name, .refID, .year }) AS this_mostRecentBooks
}
WITH *
WHERE (this.name = "Simone" AND any(var in this_mostRecentBooks WHERE var.name = "Simone's adventures!"))
RETURN this { .name, mostRecentBooks: this_mostRecentBook } AS this
```

#### SINGLE filter

The `_SINGLE` filter is based on the predicate function `single`, this behavior has to be changed for `@cypher` resolved fields.

**GraphQL**

```graphql
{
    authors(where: { name: "Simone", mostRecentBooks_SINGLE: { name: "Simone's adventures!" } }) {
        name
        mostRecentBooks {
            name
            year
        }
    }
}
```

**Current mostRecentBooks predicate**

```cypher
single(this0 IN [(this)-[:AUTHORED_BOOK]->(this0:`Book`) | this0] WHERE this0.name = "Simone's adventures!")
```

As the `mostRecentBooks` is already resolved it's possible to filter it directly without the pattern matching, as follows:

**Cypher Proposed**

```cypher
MATCH (this:`Author`)
CALL {
    WITH this
    CALL {
        WITH this
        MATCH (this)-[:AUTHORED_BOOK]->(b:Book) RETURN b AS result ORDER BY b.year DESC LIMIT 1
    }
    WITH result AS this_mostRecentBooks
    RETURN head(collect(this_mostRecentBooks { .name, .year })) AS this_mostRecentBooks
}
WITH *
WHERE (this.name = "Simone" AND single(var in this_mostRecentBooks WHERE var.name = "Simone's adventures!"))
RETURN this { .name, mostRecentBooks: this_mostRecentBook } AS this
```

#### ALL filter

The `_ALL` filter is based on a combination of the `EXISTS` sub-clause, this behavior has to be changed for `@cypher` resolved fields.

**GraphQL**

```graphql
{
    authors(where: { name: "Simone", mostRecentBooks_ALL: { name: "Simone's adventures!" } }) {
        name
        mostRecentBooks {
            name
            year
        }
    }
}
```

**Current mostRecentBooks predicate**

```cypher
WHERE (EXISTS {
    MATCH (this)-[:AUTHORED_BOOK]->(this0:`Book`)
    WHERE this0.name = "Simone's adventures!"
} AND NOT (EXISTS {
    MATCH (this)-[:AUTHORED_BOOK]->(this0:`Book`)
    WHERE NOT (this0.name = "Simone's adventures!"
}))
```

As the `mostRecentBooks` is already resolved it's possible to filter it directly without the `EXISTS` sub-clause,
but by using the `all` predicate function as follow:

**Cypher Proposed**

```cypher
MATCH (this:`Author`)
CALL {
    WITH this
    CALL {
        WITH this
        MATCH (this)-[:AUTHORED_BOOK]->(b:Book) RETURN b AS result ORDER BY b.year DESC LIMIT 1
    }
    WITH result AS this_mostRecentBooks
    RETURN head(collect(this_mostRecentBooks { .name, .year })) AS this_mostRecentBooks
}
WITH *
WHERE (this.name = "Simone" AND all(var in this_mostRecentBooks WHERE var.name = "Simone's adventures!"))
RETURN this { .name, mostRecentBooks: this_mostRecentBook } AS this
```

## Risks

-   This solution is relying on the new less used and tested `columnName` feature.

## Security consideration

-   None.

## Out of Scope

-   Aggregation filters.
-   Connections filters.
