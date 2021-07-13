# Cypher coalesce()

Tests for queries where queried fields are decorated with @coalesce

Schema:

```graphql
type User {
    id: ID! @coalesce(value: "00000000-00000000-00000000-00000000")
    name: String! @coalesce(value: "Jane Smith")
    verified: Boolean! @coalesce(value: false)
    numberOfFriends: Int! @coalesce(value: 0)
    rating: Float! @coalesce(value: 2.5)
}
```

```env
NEO4J_GRAPHQL_ENABLE_REGEX=1
```

---

## Simple

### GraphQL Input

```graphql
query(
    $id: ID
    $name: String
    $verified: Boolean
    $numberOfFriends: Int
    $rating: Float
) {
    users(
        where: {
            id: $id
            name_MATCHES: $name
            verified_NOT: $verified
            numberOfFriends_GT: $numberOfFriends
            rating_LT: $rating
        }
    ) {
        name
    }
}
```

### GraphQL Params Input

```json
{
    "id": "Some ID",
    "name": "Some name",
    "verified": true,
    "numberOfFriends": 10,
    "rating": 3.5
}
```

### Expected Cypher Output

```cypher
MATCH (this:User)
WHERE coalesce(this.id, "00000000-00000000-00000000-00000000") = $this_id
AND coalesce(this.name, "Jane Smith") =~ $this_name_MATCHES
AND (NOT coalesce(this.verified, false) = $this_verified_NOT)
AND coalesce(this.numberOfFriends, 0) > $this_numberOfFriends_GT
AND coalesce(this.rating, 2.5) < $this_rating_LT
RETURN this { .name } as this
```

### Expected Cypher Params

```json
{
    "this_id": "Some ID",
    "this_name_MATCHES": "Some name",
    "this_verified_NOT": true,
    "this_numberOfFriends_GT": {
        "high": 0,
        "low": 10
    },
    "this_rating_LT": 3.5
}
```

---
