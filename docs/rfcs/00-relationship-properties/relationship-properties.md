# Relationship Properties

## Problem

`@neo4j/graphql` currently doesn't support relationship properties, which is preventing a number of users migrating from `neo4j-graphql-js`.

## Usage example

### Type definitions

`@relationship` directive in each node on either side of the relationship has an additional `properties` argument containing the name of an interface which defines relationship properties.

```graphql
type Movie {
    title: String!
    actors: [Actor!]!
        @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
}

type Actor {
    name: String!
    movies: [Movie!]!
        @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
}

interface ActedIn {
    screenTime: Int!
}
```

#### Notes

-   Much like node types, property interfaces can be named however users see fit. If the same relationship type can be used for different node combinations, they can name them differently to distinguish between them.
-   As per the current implementation, all types will be assumed to be node types and will have the relevant queries and mutations generated for them.
-   An error will be thrown if a `@relationship` directive "pair" don't share the same `properties` value.

### Schema changes

#### New types for relationship properties and relationships

Relationship types are automatically generated, one for each direction of a relationship. They are synonymous with the Relay concept of edges, with a field `node` which is the type at the other end of the relationship. The remaining fields will be from the properties interface which was specified in the `@relationship` directive, and the relationship type will implement that interface.

```graphql
interface ActedIn {
    screenTime: Int!
}

type ActorMoviesRelationship implements ActedIn {
    node: Movie!
    screenTime: Int!
}

type MovieActorsRelationship implements ActedIn {
    node: Actor!
    screenTime: Int!
}
```

#### New Connection types

Connection types will be automatically generated for all relationships to facilitate relationship properties, and at a later time, cursor-based pagination.

```graphql
type ActorMoviesConnection {
    edges: [ActorMoviesRelationship!]!
}

type MovieActorsConnection {
    edges: [MovieActorsRelationship!]!
}
```

#### New Where and Sort types

There will be two new Where input types and two new Sort input types, one of each for relationship properties, and one of each to compose node and relationship properties together.

For relationship properties:

```graphql
input ActedInWhere {
    screenTime: Int
    screenTime_NOT: Int
    screenTime_LT: Int
    screenTime_LTE: Int
    screenTime_GT: Int
    screenTime_GTE: Int
    screenTime_IN: [Int]
    screenTime_NOT_IN: [Int]
    AND: [ActedInWhere!]
    OR: [ActedInWhere!]
}

input ActedInSort {
    screenTime: SortDirection
}
```

And for composites of both node and relationship properties ("Connection" needed in name to avoid collisions):

```graphql
input ActorMoviesConnectionWhere {
    edge: ActedInWhere
    edge_NOT: ActedInWhere
    node: MovieWhere
    node_NOT: MovieWhere
    AND: [ActorMoviesConnectionWhere!]
    OR: [ActorMoviesConnectionWhere!]
}

input ActorMoviesConnectionSort {
    edge: ActedInSort
    node: MovieSort
}

input MovieActorsConnectionWhere {
    edge: ActedInWhere
    edge_NOT: ActedInWhere
    node: ActorWhere
    node_NOT: ActorWhere
    AND: [MovieActorsConnectionWhere!]
    OR: [MovieActorsConnectionWhere!]
}

input MovieActorsConnectionSort {
    edge: ActedInSort
    node: ActorSort
}
```

#### Changes to node types

Connection fields are added in addition to direct relationship fields, with arguments for filtering and sorting what is returned. These arguments allow for filtering and sorting on node and/or relationship properties.

```graphql
type Actor {
    id: ID!
    name: String!
    movies(where: MovieWhere, options: MovieOptions): [Movie!]!
    moviesAggregate(where: MovieWhere): MovieAggregateSelection!
    moviesConnection(
        where: ActorMoviesConnectionWhere
        sort: [ActorMoviesConnectionSort!]
    ): ActorMoviesConnection!
}

type Movie {
    id: ID!
    title: String!
    actors(where: ActorWhere, options: ActorOptions): [Actor!]!
    actorsConnection(
        where: MovieActorsConnectionWhere
        sort: [MovieActorsConnectionSort!]
    ): MovieActorsConnection!
}
```

#### Input types for relationship properties

Two new types will exist for each set of relationship properties - one for creating a relationship and one for updating the properties on an existing relationship. Two types are needed to respect if properties are mandatory on creation:

```graphql
input ActedInCreateInput {
    screenTime: Int!
}

input ActedInUpdateInput {
    screenTime: Int
}
```

#### Changes to nested creates

There are new input types to facilitate the setting of relationship properties when performing nested creates.

```graphql
input MovieCreateFieldInput {
    edge: ActedInCreateInput!
    node: MovieCreateInput!
}

input ActorCreateFieldInput {
    edge: ActedInCreateInput!
    node: ActorCreateInput!
}
```

Now where nested create operations and `RelationInput` input types used the `ActorCreateInput` / `MovieCreateInput` types directly, they will use these in their place. This will be a breaking change and result in a major version bump.

#### Changes to nested connects

`ConnectFieldInput` types now contain a `properties` field for setting relationship properties on new relationships.

```graphql
input ActorConnectFieldInput {
    where: ActorWhere
    edge: ActedInCreateInput
    connect: ActorConnectInput
}

input MovieConnectFieldInput {
    where: MovieWhere
    edge: ActedInCreateInput
    connect: MovieConnectInput
}
```

#### Changes to nested updates

The `update` field of each `UpdateFieldInput` type is now of a different type to allow setting relationship properties on existing relationships.

Additionally, the `where` argument will be changed so that filtering can be done on either node or relationship properties. This will be a breaking change and result in a major version bump.

```graphql
input ActorMoviesConnectionUpdateInput {
    edge: ActedInUpdateInput
    node: MovieUpdateInput
}

input ActorMoviesUpdateFieldInput {
    where: ActorMoviesConnectionWhere
    update: ActorMoviesConnectionUpdateInput
    connect: [MovieConnectFieldInput!]
    create: [MovieCreateFieldInput!]
    disconnect: [MovieDisconnectFieldInput!]
    delete: [MovieDeleteFieldInput!]
}

input MovieActorsConnectionUpdateInput {
    edge: ActedInUpdateInput
    node: ActorUpdateInput
}

input MovieActorsUpdateFieldInput {
    where: MovieActorsConnectionWhere
    update: MovieActorsConnectionUpdateInput
    create: [ActorCreateFieldInput!]
    connect: [ActorConnectFieldInput!]
    disconnect: [ActorDisconnectFieldInput!]
    delete: [ActorDeleteFieldInput!]
}
```

### Example Queries

#### With `where` and `sort` arguments

For the movie "Forrest Gump", match all actors whose name begins with "Tom", and return their name and screenTime, all ordered by their name ascending.

```graphql
query {
    movies(where: { title: "Forrest Gump" }) {
        title
        actorsConnection(
            where: { node: { name_STARTS_WITH: "Tom" } }
            sort: { node: { name: ASC } }
        ) {
            edges {
                screenTime
                node {
                    name
                }
            }
        }
    }
}
```

### Example Mutations

#### Create one node and connect it to another existing node, specifying relationship properties

Create a movie "Forrest Gump", and connect it to the existing actor Tom Hanks, specifying his screen time.

```graphql
mutation {
    createMovies(
        input: [
            {
                title: "Forrest Gump"
                actors: {
                    connect: [
                        {
                            where: { name: "Tom Hanks" }
                            edge: { screenTime: 60 }
                        }
                    ]
                }
            }
        ]
    ) {
        movies {
            title
        }
    }
}
```

#### Create one node, create another node, and connect them together, specifying relationship properties

Create a movie "Forrest Gump", create an actor Tom Hanks, and connect them together, specifying his screen time.

```graphql
mutation {
    createMovies(
        input: [
            {
                title: "Forrest Gump"
                actors: {
                    create: [
                        {
                            node: { name: "Tom Hanks" }
                            edge: { screenTime: 60 }
                        }
                    ]
                }
            }
        ]
    ) {
        movies {
            title
        }
    }
}
```

#### Update a relationship property on a relationship between two specified nodes

For the existing movie "Forrest Gump" and its Actor "Tom Hanks", update his screen time on the relationship.

```graphql
mutation {
    updateMovies(
        where: { title: "Forrest Gump" }
        update: {
            actors: [
                {
                    where: { node: { name: "Tom Hanks" } }
                    update: { edge: { screenTime: 60 } }
                }
            ]
        }
    ) {
        movies {
            title
        }
    }
}
```
