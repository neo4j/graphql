## Schema Points

Tests that the provided typeDefs return the correct schema.

---

### Point

**TypeDefs**

```typedefs-input
type Movie {
    filmedAt: Point!
}
```

**Output**

```schema-output
type Point {
  latitude: Float!
  longitude: Float!
  height: Float
  crs: String!
  srid: Int!
}

input PointInput {
  latitude: Float!
  longitude: Float!
  height: Float
}

input PointDistance {
  point: PointInput!
  """The distance in metres to be used when comparing two points"""
  distance: Float!
}

type Movie {
  filmedAt: Point!
}

type DeleteInfo {
  nodesDeleted: Int!
  relationshipsDeleted: Int!
}


input MovieCreateInput {
  filmedAt: PointInput
}

input MovieOptions {
  sort: [MovieSort]
  limit: Int
  skip: Int
}

enum MovieSort {
  filmedAt_ASC
  filmedAt_DESC
}

input MovieWhere {
  filmedAt: PointInput
  filmedAt_NOT: PointInput
  filmedAt_IN: [PointInput]
  filmedAt_NOT_IN: [PointInput]
  filmedAt_LT: PointDistance
  filmedAt_LTE: PointDistance
  filmedAt_GT: PointDistance
  filmedAt_GTE: PointDistance
  filmedAt_DISTANCE: PointDistance
  OR: [MovieWhere]
  AND: [MovieWhere]
}

input MovieUpdateInput {
  filmedAt: PointInput
}

type CreateMoviesMutationResponse {
  movies: [Movie!]!
}

type UpdateMoviesMutationResponse {
  movies: [Movie!]!
}

type Mutation {
  createMovies(input: [MovieCreateInput]!): CreateMoviesMutationResponse!
  deleteMovies(where: MovieWhere): DeleteInfo!
  updateMovies(where: MovieWhere, update: MovieUpdateInput): UpdateMoviesMutationResponse!
}

type Query {
  movies(where: MovieWhere, options: MovieOptions): [Movie]!
}
```

---

### CartesianPoint

**TypeDefs**

```typedefs-input
type Machine {
    partLocation: CartesianPoint!
}
```

**Output**

```schema-output
type CartesianPoint {
  x: Float!
  y: Float!
  z: Float
  crs: String!
  srid: Int!
}

input CartesianPointInput {
  x: Float!
  y: Float!
  z: Float
}

input CartesianPointDistance {
  point: CartesianPointInput!
  distance: Float!
}

type Machine {
  partLocation: CartesianPoint!
}

type DeleteInfo {
  nodesDeleted: Int!
  relationshipsDeleted: Int!
}

input MachineCreateInput {
  partLocation: CartesianPointInput
}

input MachineOptions {
  sort: [MachineSort]
  limit: Int
  skip: Int
}

enum MachineSort {
  partLocation_ASC
  partLocation_DESC
}

input MachineWhere {
  partLocation: CartesianPointInput
  partLocation_NOT: CartesianPointInput
  partLocation_IN: [CartesianPointInput]
  partLocation_NOT_IN: [CartesianPointInput]
  partLocation_LT: CartesianPointDistance
  partLocation_LTE: CartesianPointDistance
  partLocation_GT: CartesianPointDistance
  partLocation_GTE: CartesianPointDistance
  partLocation_DISTANCE: CartesianPointDistance
  OR: [MachineWhere]
  AND: [MachineWhere]
}

input MachineUpdateInput {
  partLocation: CartesianPointInput
}

type CreateMachinesMutationResponse {
  machines: [Machine!]!
}

type UpdateMachinesMutationResponse {
  machines: [Machine!]!
}

type Mutation {
  createMachines(input: [MachineCreateInput]!): CreateMachinesMutationResponse!
  deleteMachines(where: MachineWhere): DeleteInfo!
  updateMachines(where: MachineWhere, update: MachineUpdateInput): UpdateMachinesMutationResponse!
}

type Query {
  machines(where: MachineWhere, options: MachineOptions): [Machine]!
}
```

---

### Points

**TypeDefs**

```typedefs-input
type Movie {
    filmedAt: [Point!]!
}
```

**Output**

```schema-output
type Point {
  latitude: Float!
  longitude: Float!
  height: Float
  crs: String!
  srid: Int!
}

input PointInput {
  latitude: Float!
  longitude: Float!
  height: Float
}

type Movie {
  filmedAt: [Point!]!
}

type DeleteInfo {
  nodesDeleted: Int!
  relationshipsDeleted: Int!
}

input MovieCreateInput {
  filmedAt: [PointInput]
}

input MovieOptions {
  limit: Int
  skip: Int
}

input MovieWhere {
  filmedAt: [PointInput]
  filmedAt_NOT: [PointInput]
  filmedAt_IN: PointInput
  filmedAt_NOT_IN: PointInput
  OR: [MovieWhere]
  AND: [MovieWhere]
}

input MovieUpdateInput {
  filmedAt: [PointInput]
}

type CreateMoviesMutationResponse {
  movies: [Movie!]!
}

type UpdateMoviesMutationResponse {
  movies: [Movie!]!
}

type Mutation {
  createMovies(input: [MovieCreateInput]!): CreateMoviesMutationResponse!
  deleteMovies(where: MovieWhere): DeleteInfo!
  updateMovies(where: MovieWhere, update: MovieUpdateInput): UpdateMoviesMutationResponse!
}

type Query {
  movies(where: MovieWhere, options: MovieOptions): [Movie]!
}
```

---

### CartesianPoints

**TypeDefs**

```typedefs-input
type Machine {
    partLocations: [CartesianPoint!]!
}
```

**Output**

```schema-output
type CartesianPoint {
  x: Float!
  y: Float!
  z: Float
  crs: String!
  srid: Int!
}

input CartesianPointInput {
  x: Float!
  y: Float!
  z: Float
}

type Machine {
  partLocations: [CartesianPoint!]!
}

type DeleteInfo {
  nodesDeleted: Int!
  relationshipsDeleted: Int!
}

input MachineCreateInput {
  partLocations: [CartesianPointInput]
}

input MachineOptions {
  limit: Int
  skip: Int
}

input MachineWhere {
  partLocations: [CartesianPointInput]
  partLocations_NOT: [CartesianPointInput]
  partLocations_IN: CartesianPointInput
  partLocations_NOT_IN: CartesianPointInput
  OR: [MachineWhere]
  AND: [MachineWhere]
}

input MachineUpdateInput {
  partLocations: [CartesianPointInput]
}

type CreateMachinesMutationResponse {
  machines: [Machine!]!
}

type UpdateMachinesMutationResponse {
  machines: [Machine!]!
}

type Mutation {
  createMachines(input: [MachineCreateInput]!): CreateMachinesMutationResponse!
  deleteMachines(where: MachineWhere): DeleteInfo!
  updateMachines(where: MachineWhere, update: MachineUpdateInput): UpdateMachinesMutationResponse!
}

type Query {
  machines(where: MachineWhere, options: MachineOptions): [Machine]!
}
```

---
