# Relationship Cardinality

## Problem

At present, all relationships in principle, are treated as many-to-many relationships.

Consequences of this are:

-   If users define a one-to-\* relationship, and then execute multiple connects/creates, these will exist in the database
-   Non-nullability is never really checked

## Proposed Solution

Assuming the following type which will be used in all subsequent examples:

```graphql
type Target {
    exampleField: String
}
```

### Invalid relationship definition

For any of the fields in the following example, throw an error because of the reasons in the inline descriptions:

```graphql
type Source {
    example1: [Target!]! @relationship(type: "HAS_TARGET", direction: OUT) # If there are no relationships, then should always be empty array and not null
    example2: [Target]! @relationship(type: "HAS_TARGET", direction: OUT) # This suggests a relationship with no target node
    example3: [Target] @relationship(type: "HAS_TARGET", direction: OUT) # This is a combination of both of the above problems
}
```

### One-to-\* relationships

#### Nullable one-to-\* relationship

For example:

```graphql
type Source {
    example4: Target @relationship(type: "HAS_TARGET", direction: OUT)
}
```

Rules:

-   No requirement to create or connect to a `Target` on the creation of a `Source`
-   Once a `Source` has been connected to a `Target`, no more can be connected (post-operation check in Cypher)
-   A connection can only be made using unique fields for filtering, to prevent the connection to more than one node
-   To change the connected node, you can either:
    -   Disconnect in one Mutation, and then connect in another Mutation
    -   Disconnect and connect in the same Mutation field (nested operations next to each other)
    -   Some new redirect operation???

#### Non-nullable one-to-\* relationship

For example:

```graphql
type Source {
    example5: Target! @relationship(type: "HAS_TARGET", direction: OUT)
}
```

Rules:

-   You MUST create or connect to a `Target` on the creation of a `Source`
-   Once a `Source` has been connected to a `Target`, no more can be connected (post-operation check in Cypher)
-   You cannot disconnect a `Target` from a `Source` without re-establishing a relationship in the same operation
-   A connection can only be made using unique fields for filtering, to prevent the connection to more than one node
-   To change the connected node, you can either:
    -   Disconnect and connect in the same Mutation field (nested operations next to each other)
    -   Some new redirect operation???

#### Operations

`create`, `connect`, `connectOrCreate` should throw an error is something is already connected (should this be a pre-check rather than post for performance reasons?)

`disconnect`, `update` and `delete` should have `_emptyInput` if no nested relationships.

#### Cardinality Checks in Cypher

After any operations on a one-to-\* relationship or its terminating nodes, we should check that the cardinality of the relationship has been maintained.

This can be achieved using `apoc.util.validate`, something akin to the following which ensures relationship count is 1:

```cypher
MATCH (:Source)<-[has_target:HAS_TARGET]-(:Target)
WITH count(has_target) as has_target_count
CALL apoc.util.validate(NOT(apoc.util.validatePredicate(NOT(has_target_count = 1), '@neo4j/graphql/CARDINALITY_VIOLATION Source.target must be 1', [0])), '@neo4j/graphql/CARDINALITY_VIOLATION', [0])
```

There is likely a much cleaner solution than this.

### Many-to-many relationship

For example:

```graphql
type Source {
    example6: [Target!]! @relationship(type: "Source", direction: OUT)
}
```

No changes needed here, this is covered by the existing operations.

## Risks

This is a breaking change for any users using one-to-\* relationships.

## Out of Scope

-   Complex filtering for connecting to neighbouring nodes for one-to-\* relationships (for example `_STARTS_WITH`, `_LT`, etc.) because we are using a unique field for filtering
    -   It could be an option in future to run post-operation checks to ensure cardinality. This would add support for filtering on non-unique fields. This could be added without being a breaking change.
