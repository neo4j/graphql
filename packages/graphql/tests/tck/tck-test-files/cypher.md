## Simple Cypher tests

Simple queries with arguments and variables.

Schema:

```schema
type Movie {
    id: ID
    title: String
}
type Query {
    Movie(title: String): Movie
}
```

---

### Single selection, Movie by title

**GraphQL input**

```graphql
{
    Movie(title: "River Runs Through It, A") {
        title
    }
}
```

**Expected Cypher output**

```cypher
MATCH (`movie`:`Movie` { `title`:$title }) RETURN `movie` { .title } AS `movie`
```

**Expected Cypher params**

```cypher-params
{ "title": "River Runs Through It, A" }
```

---

### Multi selection, Movie by title

**GraphQL input**

```graphql
{
    Movie(title: "River Runs Through It, A") {
        id
        title
    }
}
```

**Expected Cypher output**

```cypher
MATCH (`movie`:`Movie` { `title`:$title }) RETURN `movie` { .id, .title } AS `movie`
```

**Expected Cypher params**

```cypher-params
{ "title": "River Runs Through It, A" }
```

---

### Multi selection, Movie by title via variable

**GraphQL input**

```graphql
query($title: String) {
    Movie(title: $title) {
        id
        title
    }
}
```

**GraphQL params input**

```graphql-params
{ "title": "some title" }
```

**Expected Cypher output**

```cypher
MATCH (`movie`:`Movie` { `title`:$title }) RETURN `movie` { .id, .title } AS `movie`
```

**Expected Cypher params**

```cypher-params
{ "title": "some title" }
```
