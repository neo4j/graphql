## Cypher Points

Tests TimeStamps operations. ⚠ The string in params is actually an object but the test suite turns it into a string when calling `JSON.stringify`.

Schema:

```schema
type PointContainer {
    point: Point
    cartesianPoint: CartesianPoint
}
```

---

### Simple Point query

**GraphQL input**

```graphql
{
    pointContainers(where: { point: { longitude: 1.0, latitude: 2.0 } }) {
        point {
            longitude
            latitude
        }
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:PointContainer)
WHERE this.point = point($this_point)
RETURN this { .point } as this
```

**Expected Cypher params**

```cypher-params
{
  "this_point": {
    "longitude": 1,
    "latitude": 2
  }
}
```

---

### Simple CartesianPoint query

**GraphQL input**

```graphql
{
    pointContainers(where: { cartesianPoint: { x: 1.0, y: 2.0 } }) {
        cartesianPoint {
            x
            y
        }
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:PointContainer)
WHERE this.cartesianPoint = point($this_cartesianPoint)
RETURN this { .cartesianPoint } as this
```

**Expected Cypher params**

```cypher-params
{
  "this_cartesianPoint": {
    "x": 1,
    "y": 2
  }
}
```

---

### Simple Point NOT query

**GraphQL input**

```graphql
{
    pointContainers(where: { point_NOT: { longitude: 1.0, latitude: 2.0 } }) {
        point {
            longitude
            latitude
        }
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:PointContainer)
WHERE (NOT this.point = point($this_point_NOT))
RETURN this { .point } as this
```

**Expected Cypher params**

```cypher-params
{
  "this_point_NOT": {
    "longitude": 1,
    "latitude": 2
  }
}
```

---

### Simple CartesianPoint NOT query

**GraphQL input**

```graphql
{
    pointContainers(where: { cartesianPoint_NOT: { x: 1.0, y: 2.0 } }) {
        cartesianPoint {
            x
            y
        }
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:PointContainer)
WHERE (NOT this.cartesianPoint = point($this_cartesianPoint_NOT))
RETURN this { .cartesianPoint } as this
```

**Expected Cypher params**

```cypher-params
{
  "this_cartesianPoint_NOT": {
    "x": 1,
    "y": 2
  }
}
```
