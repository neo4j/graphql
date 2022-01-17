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

### Usage Examples

## Risks

**OGM** - we need to figure out how this will work with the new API!

## Out of Scope

