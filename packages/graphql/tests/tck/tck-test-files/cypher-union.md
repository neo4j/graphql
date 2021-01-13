## Cypher Union

Tests for queries on Unions.

Schema:

```schema
union Search = Movie | Genre

type Genre @auth(rules: [
    {
        operations: ["read"],
        allow: {
            name: "jwtAllowedNamesExample"
        }
    }
]) {
    name: String
}

type Movie {
    title: String
    search: [Search] @relationship(type: "SEARCH", direction: "OUT")
}
```

---

### Read Unions

**GraphQL input**

```graphql
{
    Movies(where: { title: "some title" }) {
        search(
            Movie: { title: "The Matrix" }
            Genre: { name: "Horror" }
            options: { skip: 1, limit: 10 }
        ) {
            ... on Movie {
                title
            }
            ... on Genre {
                name
            }
        }
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
WHERE this.title = $this_title

RETURN this {
    search: [(this)-[:SEARCH]->(this_search)
        WHERE "Genre" IN labels(this_search) OR "Movie" IN labels(this_search) |
        head(
            [ this_search IN [this_search]
                WHERE "Genre" IN labels (this_search) AND
                this_search.name = $this_search_Genre_name AND
                apoc.util.validatePredicate(NOT(this_search.name = $this_search_Genre_auth0_name), "Forbidden", [0])  |
                this_search {
                    __resolveType: "Genre",
                     .name
                } ] +
            [ this_search IN [this_search]
                WHERE "Movie" IN labels (this_search) AND
                this_search.title = $this_search_Movie_title |
                this_search {
                    __resolveType: "Movie",
                    .title
                } ]
        )
    ] [1..10]
} as this
```

**Expected Cypher params**

```cypher-params
{
    "this_title": "some title",
    "this_search_Genre_auth0_name": ["Horror"],
    "this_search_Genre_name": "Horror",
    "this_search_Movie_title": "The Matrix"
}
```

**JWT Object**

```jwt
{
    "jwtAllowedNamesExample": ["Horror"]
}
```

---

### Create Unions

**GraphQL input**

```graphql
mutation {
    createMovies(
        input: [
            {
                title: "some movie"
                search_Genre: { create: [{ name: "some genre" }] }
            }
        ]
    ) {
        movies {
            title
        }
    }
}
```

**Expected Cypher output**

```cypher
CALL {
    CREATE (this0:Movie)
    SET this0.title = $this0_title

    WITH this0
    CREATE (this0_search_Genre0:Genre)
    SET this0_search_Genre0.name = $this0_search_Genre0_name
    MERGE (this0)-[:SEARCH]->(this0_search_Genre0)

    RETURN this0
}

RETURN this0 {
    .title
} AS this0
```

**Expected Cypher params**

```cypher-params
{
   "this0_title": "some movie",
   "this0_search_Genre0_name": "some genre"
}
```

---

### Connect Unions

**GraphQL input**

```graphql
mutation {
    createMovies(
        input: [
            {
                title: "some movie"
                search_Genre: { connect: [{ where: { name: "some genre" } }] }
            }
        ]
    ) {
        movies {
            title
        }
    }
}
```

**Expected Cypher output**

```cypher
CALL {
    CREATE (this0:Movie)
    SET this0.title = $this0_title

    WITH this0
    OPTIONAL MATCH (this0_search_Genre_connect0:Genre)
    WHERE this0_search_Genre_connect0.name = $this0_search_Genre_connect0_name
    FOREACH(_ IN CASE this0_search_Genre_connect0 WHEN NULL THEN [] ELSE [1] END |
        MERGE (this0)-[:SEARCH]->(this0_search_Genre_connect0)
    )

    RETURN this0
}

RETURN this0 { .title } AS this0
```

**Expected Cypher params**

```cypher-params
{
   "this0_title": "some movie",
   "this0_search_Genre_connect0_name": "some genre"
}

```

---

### Update Unions

**GraphQL input**

```graphql
mutation {
    updateMovies(
        where: { title: "some movie" }
        update: {
            search_Genre: {
                where: { name: "some genre" }
                update: { name: "some new genre" }
            }
        }
    ) {
        movies {
            title
        }
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
WHERE this.title = $this_title

WITH this
OPTIONAL MATCH (this)-[:SEARCH]->(this_search_Genre0:Genre)
WHERE this_search_Genre0.name = $this_search_Genre0_name
CALL apoc.do.when(this_search_Genre0 IS NOT NULL, " SET this_search_Genre0.name = $this_update_search_Genre0_name RETURN count(*) ", "", {this:this, this_search_Genre0:this_search_Genre0, this_update_search_Genre0_name:$this_update_search_Genre0_name}) YIELD value as _

RETURN this { .title } AS this
```

**Expected Cypher params**

```cypher-params
{
   "this_title": "some movie",
   "this_search_Genre0_name": "some genre",
   "this_update_search_Genre0_name": "some new genre"
}
```

---

### Disconnect Unions

**GraphQL input**

```graphql
mutation {
    updateMovies(
        where: { title: "some movie" }
        update: {
            search_Genre: { disconnect: [{ where: { name: "some genre" } }] }
        }
    ) {
        movies {
            title
        }
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
WHERE this.title = $this_title

WITH this
OPTIONAL MATCH (this)-[this_search_Genre0_disconnect0_rel:SEARCH]->(this_search_Genre0_disconnect0:Genre)
WHERE this_search_Genre0_disconnect0.name = $this_search_Genre0_disconnect0_name
FOREACH(_ IN CASE this_search_Genre0_disconnect0 WHEN NULL THEN [] ELSE [1] END |
    DELETE this_search_Genre0_disconnect0_rel
)

RETURN this { .title } AS this
```

**Expected Cypher params**

```cypher-params
{
   "this_title": "some movie",
   "this_search_Genre0_disconnect0_name": "some genre"
}
```
