## Cypher pagination tests

Tests for queries including reserved arguments `skip` and `limit`.

Schema:

```schema
type Movie {
    id: ID
    title: String
}
```

---

### Skipping

**GraphQL input**

```graphql
{
    Movies(options: {skip: 1}) {
        title
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie) 
RETURN this { .title } as this
SKIP $this_skip
```

**Expected Cypher params**

```cypher-params
{
    "this_skip": {
        "high": 0,
        "low": 1
    }
}
```

---

### Limit

**GraphQL input**

```graphql
{
    Movies(options: {limit: 1}) {
        title
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie) 
RETURN this { .title } as this
LIMIT $this_limit
```

**Expected Cypher params**

```cypher-params
{
    "this_limit": {
        "high": 0,
        "low": 1
    }
}
```

---

### Skip + Limit

**GraphQL input**

```graphql
{
    Movies(options: {limit: 1, skip: 2}) {
        title
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie) 
RETURN this { .title } as this
SKIP $this_skip
LIMIT $this_limit
```

**Expected Cypher params**

```cypher-params
{
    "this_limit": {
        "high": 0,
        "low": 1
    },
    "this_skip": {
        "high": 0,
        "low": 2
    }
}
```

---

### Skip + Limit as variables

**GraphQL input**

```graphql
query($skip: Int, $limit: Int) {
    Movies(options: {limit: $limit, skip: $skip}) {
        title
    }
}
```

**GraphQL params input**

```graphql-params
{
    "skip": 2,
    "limit": 1
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie) 
RETURN this { .title } as this
SKIP $this_skip
LIMIT $this_limit
```

**Expected Cypher params**

```cypher-params
{
    "this_skip": {
        "high": 0,
        "low": 2
    },
    "this_limit": {
        "high": 0,
        "low": 1
    }
}
```

---

### Skip + Limit with other variables

**GraphQL input**

```graphql
query($skip: Int, $limit: Int, $title: String) {
    Movies(
        options: {limit: $limit, skip: $skip},
        where: {title: $title}
    ) {
        title
    }
}
```

**GraphQL params input**

```graphql-params
{
    "limit": 1,
    "skip": 2,
    "title": "some title"
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie) 
WHERE this.title = $this_title
RETURN this { .title } as this
SKIP $this_skip
LIMIT $this_limit
```

**Expected Cypher params**

```cypher-params
{
    "this_limit": {
        "high": 0,
        "low": 1
    },
    "this_skip": {
        "high": 0,
        "low": 2
    },
    "this_title": "some title"
}
```
