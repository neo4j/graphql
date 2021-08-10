## Cypher BigInt

Tests BigInt scalar type.

Schema:

```schema
type File {
    name: String!
    size: BigInt!
}
```

---

### Querying with native BigInt in AST

**GraphQL input**

```graphql
query {
    files(where: { size: 9223372036854775807 }) {
        name
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:File)
WHERE this.size = $this_size
RETURN this { .name } as this
```

**Expected Cypher params**

```cypher-params
{
    "this_size": {
        "low": -1,
        "high": 2147483647
    }
}
```

---

### Querying with BigInt as string in AST

**GraphQL input**

```graphql
query {
    files(where: { size: "9223372036854775807" }) {
        name
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:File)
WHERE this.size = $this_size
RETURN this { .name } as this
```

**Expected Cypher params**

```cypher-params
{
    "this_size": {
        "low": -1,
        "high": 2147483647
    }
}
```

---

### Querying with BigInt as string in variables

**GraphQL input**

```graphql
query Files($size: BigInt) {
    files(where: { size: $size }) {
        name
    }
}
```

**GraphQL params**

```graphql-params
{
    "size": "9223372036854775807"
}
```

**Expected Cypher output**

```cypher
MATCH (this:File)
WHERE this.size = $this_size
RETURN this { .name } as this
```

**Expected Cypher params**

```cypher-params
{
    "this_size": {
        "low": -1,
        "high": 2147483647
    }
}
```

---
