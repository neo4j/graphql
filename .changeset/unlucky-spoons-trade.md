---
"@neo4j/graphql": minor
---

Introduce a new style for filtering relationships and connections.
The quantifiers `SOME` | `NONE` | `SINGLE` | `ALL` are now available as a nested input object.

**Relationship**

```graphql
{
    movies(where: { genres: { some: { name: { equals: "some genre" } } } }) {
        actorCount
    }
}
```

**Connection** 
```graphql
{
    movies(where: { genresConnection: { some: { node: { name: { equals: "some genre" } } } } }) {
        actorCount
    }
}
```
