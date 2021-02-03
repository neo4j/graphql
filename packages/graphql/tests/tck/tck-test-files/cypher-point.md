## Cypher Points

Tests Cypher generation for spatial types. Points and CartesianPoints are processed equivalently when it comes to Cypher translation, so only one needs to be extensively tested.

Schema:

```schema
type PointContainer {
    id: String
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
            crs
        }
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:PointContainer)
WHERE this.point = point($this_point)
RETURN this { point: { point: this.point, crs: this.point.crs } } as this
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
RETURN this { cartesianPoint: { point: this.cartesianPoint } } as this
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
RETURN this { point: { point: this.point } } as this
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
RETURN this { cartesianPoint: { point: this.cartesianPoint } } as this
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

---

### Simple Point create mutation

**GraphQL input**

```graphql
mutation {
    createPointContainers(input: { point: { longitude: 1.0, latitude: 2.0 } }) {
        pointContainers {
            point {
                longitude
                latitude
                crs
            }
        }
    }
}
```

**Expected Cypher output**

```cypher
CALL {
    CREATE (this0:PointContainer)
    SET this0.point = point($this0_point)
    RETURN this0
}

RETURN
this0 { point: { point: this0.point, crs: this0.point.crs } } AS this0
```

**Expected Cypher params**

```cypher-params
{
  "this0_point": {
    "longitude": 1,
    "latitude": 2
  }
}
```

---

### Simple Point update mutation

**GraphQL input**

```graphql
mutation {
    updatePointContainers(
        where: { id: "id" }
        update: { point: { longitude: 1.0, latitude: 2.0 } }
    ) {
        pointContainers {
            point {
                longitude
                latitude
                crs
            }
        }
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:PointContainer)
WHERE this.id = $this_id
SET this.point = point($this_update_point)
RETURN this { point: { point: this.point, crs: this.point.crs } } AS this
```

**Expected Cypher params**

```cypher-params
{
  "this_id": "id",
  "this_update_point": {
    "longitude": 1,
    "latitude": 2
  }
}
```
