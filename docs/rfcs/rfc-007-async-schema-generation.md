# Async Schema Generation

## Problem

Schema generation is slow. We might not improve things right now, but schema 
generation being asynchronous is going to give us more options moving forward.

## Proposed Solution

```ts
const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

const schema = await neoSchema.getSchema();
```

### Constructor functionality

- Validate type definitions
- Store class members

### getSchema functionality

- If taking memoized route, return stored schema if exists?
- Call makeAugmentedSchema
- Store result of makeAugmentedSchema?
- Return result of makeAugmentedSchema as a Promise<GraphQLSchema>
    
### OGM
    
The OGM will need refactoring to account for the new asynchronous `getSchema` method in `Neo4jGraphQL`.

This will be worked around by introducing an asynchronous `init` method which will be called as follows:
    
```ts
const typeDefs = `
    type User {
        name: String!
    }
`

const ogm = new OGM({ typeDefs });
const User = ogm.model("User");
await ogm.init();
const user = await User.find(...); // throws an error if init has not been called
```
    
`init` returns a type `Promise<void>`.

### Usage Examples

## Risks

## Out of Scope
