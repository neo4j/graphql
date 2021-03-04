## Cypher Points

Tests Cypher generation for arrays of spatial types. [Point] and [CartesianPoint] are processed equivalently when it comes to Cypher translation, so only one needs to be extensively tested.

Schema:

```schema
type PointContainer {
    id: String
    points: [Point]
}
```

---

### Simple Points query

**GraphQL input**

```graphql
{
    pointContainers(where: { points: [{ longitude: 1.0, latitude: 2.0 }] }) {
        points {
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
WHERE this.points = [p in $params.this_points | point(p)]
RETURN this { points: [p in this.points | { point:p, crs: p.crs }] } as this
```

**Expected Cypher params**

```cypher-params
{
  "params": {
      "this_points": [{
        "longitude": 1,
        "latitude": 2
    }]
  }
}
```

---

### Simple Points NOT query

**GraphQL input**

```graphql
{
    pointContainers(
        where: { points_NOT: [{ longitude: 1.0, latitude: 2.0 }] }
    ) {
        points {
            longitude
            latitude
        }
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:PointContainer)
WHERE (NOT this.points = [p in $params.this_points_NOT | point(p)])
RETURN this { points: [p in this.points | { point:p }] } as this
```

**Expected Cypher params**

```cypher-params
{
  "params": {
    "this_points_NOT": [{
        "longitude": 1,
        "latitude": 2
    }]
  }
}
```

---

### Simple Points IN query

**GraphQL input**

```graphql
{
    pointContainers(where: { points_IN: { longitude: 1.0, latitude: 2.0 } }) {
        points {
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
WHERE point($params.this_points_IN) IN this.points
RETURN this { points: [p in this.points | { point:p, crs: p.crs }] } as this
```

**Expected Cypher params**

```cypher-params
{
  "params": {
    "this_points_IN": {
        "longitude": 1,
        "latitude": 2
    }
  }
}
```

---

### Simple Points NOT IN query

**GraphQL input**

```graphql
{
    pointContainers(
        where: { points_NOT_IN: { longitude: 1.0, latitude: 2.0 } }
    ) {
        points {
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
WHERE (NOT point($params.this_points_NOT_IN) IN this.points)
RETURN this { points: [p in this.points | { point:p, crs: p.crs }] } as this
```

**Expected Cypher params**

```cypher-params
{
  "params": {
    "this_points_NOT_IN": {
        "longitude": 1,
        "latitude": 2
    }
  }
}
```

---

### Simple Points create mutation

**GraphQL input**

```graphql
mutation {
    createPointContainers(
        input: { points: [{ longitude: 1.0, latitude: 2.0 }] }
    ) {
        pointContainers {
            points {
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
    SET this0.points = [p in $params.this0_points | point(p)]
    RETURN this0
}

RETURN this0 { points: [p in this0.points | { point:p, crs: p.crs }] } AS this0
```

**Expected Cypher params**

```cypher-params
{
  "params": {
    "this0_points": [{
        "longitude": 1,
        "latitude": 2
    }]
  }
}
```

---

### Simple Points update mutation

**GraphQL input**

```graphql
mutation {
    updatePointContainers(
        where: { id: "id" }
        update: { points: [{ longitude: 1.0, latitude: 2.0 }] }
    ) {
        pointContainers {
            points {
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
WHERE this.id = $params.this_id
SET this.points = [p in $params.this_update_points | point(p)]
RETURN this { points: [p in this.points | { point:p, crs: p.crs }] } AS this
```

**Expected Cypher params**

```cypher-params
{
  "params": {
    "this_id": "id",
    "this_update_points": [{
        "longitude": 1,
        "latitude": 2
    }]
  }
}
```
