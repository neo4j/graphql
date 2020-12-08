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
        search(Movie: { title: "The Matrix" }, Genre: { name: "Horror" }, options: {skip: 1, limit: 10}) {
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
    search: [(this)--(this_search) 
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