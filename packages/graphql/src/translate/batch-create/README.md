# Unwind-create optimization

The unwind-create optimization provides a solution to compress in an efficient way repeated Cypher statements in a more concise query.
As the name suggests, the current implementation affects only the Create mutation.
More details at: https://github.com/neo4j/graphql/blob/dev/docs/rfcs/rfc-024-unwind-create.md

## Optimisation example

### Not optimized query

```
CALL {
CREATE (this0:Movie)
SET this0.id = $this0_id
WITH this0
WITH this0
CALL {
    WITH this0
    MATCH (this0)-[this0_website_Website_unique:HAS_WEBSITE]->(:Website)
    WITH count(this0_website_Website_unique) as c
    CALL apoc.util.validate(NOT (c <= 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDMovie.website must be less than or equal to one', [0])
    RETURN c AS this0_website_Website_unique_ignored
}
RETURN this0
}
CALL {
CREATE (this1:Movie)
SET this1.id = $this1_id
WITH this1
WITH this1
CALL {
    WITH this1
    MATCH (this1)-[this1_website_Website_unique:HAS_WEBSITE]->(:Website)
    WITH count(this1_website_Website_unique) as c
    CALL apoc.util.validate(NOT (c <= 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDMovie.website must be less than or equal to one', [0])
    RETURN c AS this1_website_Website_unique_ignored
}
RETURN this1
}
RETURN [ this0 { .id }, this1 { .id }] AS data
```

### Optimised query

```
UNWIND [ { id: $create_param0 }, { id: $create_param1 } ] AS create_var1
CALL {
    WITH create_var1
    CREATE (create_this0:\`Movie\`)
    SET
        create_this0.id = create_var1.id
    WITH create_this0
    CALL {
        WITH create_this0
        MATCH (create_this0)-[create_this0_website_Website_unique:HAS_WEBSITE]->(:Website)
        WITH count(create_this0_website_Website_unique) as c
        CALL apoc.util.validate(NOT (c <= 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDMovie.website must be less than or equal to one', [0])
        RETURN c AS create_this0_website_Website_unique_ignored
    }
    RETURN create_this0
}
RETURN collect(create_this0 { .id }) AS data
```

## Implementation

The unwind-create optimization is built on top of different phases.

### Parse the GraphQLCreateInput to obtain the unique TreeDescriptor

This phase consists in parsing the GraphQLCreateInput to obtain a TreeDescriptor that holds all the operations and the properties impacted by the operation.
This phase provides an early mechanism to identify operations not yet supported by the optimization.
The TreeDescriptor keeps a clear separation between scalar properties and nested operations.

### Parse the TreeDescriptor to obtain an GraphQLInputAST

With the TreeDescriptor already obtained, it's built a very simple Intermediate Representation named GraphQLInputAST.

### Parse the GraphQLCreateInput to obtain the UNWIND statement

At this phase, GraphQLCreateInput is translated into the UNWIND Cypher statement using the CypherBuilder.

### Visit the GraphQLInputAST with the UnwindCrateVisitor

The UnwindCreateVisitor traverses the GraphQLInputAST and generates all the nodes and edges described in the GraphQLInputAST.
The final output obtained from the UnwindCreateVisitor generates a single Cypher variable rather than one for any Nodes created in the Mutation, this means that the client needs to translate the SelectionSet accordingly.


If at any phase the optimization is no longer achievable an `UnsupportedUnwindOptimization` is raised.


