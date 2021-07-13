# Cypher Points

Tests Cypher generation for spatial types. Point and CartesianPoint are processed equivalently when it comes to Cypher translation, so only one needs to be extensively tested.

Schema:

```schema
type PointContainer {
    id: String
    point: Point
}
```

---

## Simple Point query

### GraphQL Input

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

### Expected Cypher Output

```cypher
MATCH (this:PointContainer)
WHERE this.point = point($this_point)
RETURN this { point: { point: this.point, crs: this.point.crs } } as this
```

### Expected Cypher Params

```json
{
    "this_point": {
        "longitude": 1,
        "latitude": 2
    }
}
```

---

## Simple Point NOT query

### GraphQL Input

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

### Expected Cypher Output

```cypher
MATCH (this:PointContainer)
WHERE (NOT this.point = point($this_point_NOT))
RETURN this { point: { point: this.point } } as this
```

### Expected Cypher Params

```json
{
    "this_point_NOT": {
        "longitude": 1,
        "latitude": 2
    }
}
```

---

## Simple Point IN query

### GraphQL Input

```graphql
{
    pointContainers(where: { point_IN: [{ longitude: 1.0, latitude: 2.0 }] }) {
        point {
            longitude
            latitude
            crs
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:PointContainer)
WHERE this.point IN [p in $this_point_IN | point(p)]
RETURN this { point: { point: this.point, crs: this.point.crs } } as this
```

### Expected Cypher Params

```json
{
    "this_point_IN": [
        {
            "longitude": 1,
            "latitude": 2
        }
    ]
}
```

---

## Simple Point NOT IN query

### GraphQL Input

```graphql
{
    pointContainers(
        where: { point_NOT_IN: [{ longitude: 1.0, latitude: 2.0 }] }
    ) {
        point {
            longitude
            latitude
            crs
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:PointContainer)
WHERE (NOT this.point IN [p in $this_point_NOT_IN | point(p)])
RETURN this { point: { point: this.point, crs: this.point.crs } } as this
```

### Expected Cypher Params

```json
{
    "this_point_NOT_IN": [
        {
            "longitude": 1,
            "latitude": 2
        }
    ]
}
```

---

## Simple Point LT query

### GraphQL Input

```graphql
{
    pointContainers(
        where: {
            point_LT: {
                point: { longitude: 1.1, latitude: 2.2 }
                distance: 3.3
            }
        }
    ) {
        point {
            longitude
            latitude
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:PointContainer)
WHERE distance(this.point, point($this_point_LT.point)) < $this_point_LT.distance
RETURN this { point: { point: this.point } } as this
```

### Expected Cypher Params

```json
{
    "this_point_LT": {
        "point": {
            "longitude": 1.1,
            "latitude": 2.2
        },
        "distance": 3.3
    }
}
```

---

## Simple Point LTE query

### GraphQL Input

```graphql
{
    pointContainers(
        where: {
            point_LTE: {
                point: { longitude: 1.1, latitude: 2.2 }
                distance: 3.3
            }
        }
    ) {
        point {
            longitude
            latitude
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:PointContainer)
WHERE distance(this.point, point($this_point_LTE.point)) <= $this_point_LTE.distance
RETURN this { point: { point: this.point } } as this
```

### Expected Cypher Params

```json
{
    "this_point_LTE": {
        "point": {
            "longitude": 1.1,
            "latitude": 2.2
        },
        "distance": 3.3
    }
}
```

---

## Simple Point GT query

### GraphQL Input

```graphql
{
    pointContainers(
        where: {
            point_GT: {
                point: { longitude: 1.1, latitude: 2.2 }
                distance: 3.3
            }
        }
    ) {
        point {
            longitude
            latitude
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:PointContainer)
WHERE distance(this.point, point($this_point_GT.point)) > $this_point_GT.distance
RETURN this { point: { point: this.point } } as this
```

### Expected Cypher Params

```json
{
    "this_point_GT": {
        "point": {
            "longitude": 1.1,
            "latitude": 2.2
        },
        "distance": 3.3
    }
}
```

---

## Simple Point GTE query

### GraphQL Input

```graphql
{
    pointContainers(
        where: {
            point_GTE: {
                point: { longitude: 1.1, latitude: 2.2 }
                distance: 3.3
            }
        }
    ) {
        point {
            longitude
            latitude
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:PointContainer)
WHERE distance(this.point, point($this_point_GTE.point)) >= $this_point_GTE.distance
RETURN this { point: { point: this.point } } as this
```

### Expected Cypher Params

```json
{
    "this_point_GTE": {
        "point": {
            "longitude": 1.1,
            "latitude": 2.2
        },
        "distance": 3.3
    }
}
```

---

## Simple Point DISTANCE query

### GraphQL Input

```graphql
{
    pointContainers(
        where: {
            point_DISTANCE: {
                point: { longitude: 1.1, latitude: 2.2 }
                distance: 3.3
            }
        }
    ) {
        point {
            longitude
            latitude
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:PointContainer)
WHERE distance(this.point, point($this_point_DISTANCE.point)) = $this_point_DISTANCE.distance
RETURN this { point: { point: this.point } } as this
```

### Expected Cypher Params

```json
{
    "this_point_DISTANCE": {
        "point": {
            "longitude": 1.1,
            "latitude": 2.2
        },
        "distance": 3.3
    }
}
```

---

## Simple Point create mutation

### GraphQL Input

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

### Expected Cypher Output

```cypher
CALL {
    CREATE (this0:PointContainer)
    SET this0.point = point($this0_point)
    RETURN this0
}

RETURN
this0 { point: { point: this0.point, crs: this0.point.crs } } AS this0
```

### Expected Cypher Params

```json
{
    "this0_point": {
        "longitude": 1,
        "latitude": 2
    }
}
```

---

## Simple Point update mutation

### GraphQL Input

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

### Expected Cypher Output

```cypher
MATCH (this:PointContainer)
WHERE this.id = $this_id
SET this.point = point($this_update_point)
RETURN this { point: { point: this.point, crs: this.point.crs } } AS this
```

### Expected Cypher Params

```json
{
    "this_id": "id",
    "this_update_point": {
        "longitude": 1,
        "latitude": 2
    }
}
```
