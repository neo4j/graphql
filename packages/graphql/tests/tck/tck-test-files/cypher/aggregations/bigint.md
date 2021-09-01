# Cypher Aggregations BigInt

Tests for aggregations on BigInt.

Schema:

```graphql
type File {
    size: BigInt!
}
```

---

## Min

### GraphQL Input

```graphql
{
    filesAggregate {
        size {
            min
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:File)
WITH min(this.size) AS minsize
WITH minsize
RETURN { size: { min: minsize } }
```

### Expected Cypher Params

```json
{}
```

---

## Max

### GraphQL Input

```graphql
{
    filesAggregate {
        size {
            max
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:File)
WITH max(this.size) AS maxsize
WITH maxsize
RETURN { size: { max: maxsize } }
```

### Expected Cypher Params

```json
{}
```

---

## Average

### GraphQL Input

```graphql
{
    filesAggregate {
        size {
            average
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:File)
WITH avg(this.size) AS avgsize
WITH avgsize
RETURN { size: { average: avgsize } }
```

### Expected Cypher Params

```json
{}
```

---

## Min and Max and Average

### GraphQL Input

```graphql
{
    filesAggregate {
        size {
            min
            max
            average
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:File)
WITH min(this.size) AS minsize, max(this.size) AS maxsize, avg(this.size) AS avgsize
WITH minsize, maxsize, avgsize
RETURN { size: { min: minsize,max: maxsize,average: avgsize } }
```

### Expected Cypher Params

```json
{}
```

---
