# Federation

Requirements:

- Depends on package `@apollo/subgraph`
- Opt into Federation in schema using `extend schema @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@key", "@shareable"])`
- Needs to be able to accept the `@key` directive on types
- Whenever we see a `@key` directive, add a `__resolveReference` resolver for that type
- Returns a schema by running `buildSubgraphSchema` from `@apollo/subgraph`

## PoC - OGM

### The Package

This will be a new npm package. 

The new package will depend on `@apollo/subgraph`.

An OGM using the type definitions provided by the user will be constructed on start-up.

### Defining resolvers

Given the following user type definitions:

```gql
type User @key(fields: "id organization { id }") {
  id: ID!
  organization: Organization!
}

type Organization {
  id: ID!
}
```

Type `User` has a `@key` directive which will need a `__resolveReference` resolver.
Type `Organization` does not, and as such will not need an additional resolver.

```ts
const resolvers = {
  User: {
    __resolveReference: async (user, context) => {
      const model = this.ogm.model("User");
      return model.find({ where: user, context });
    }
  }
}
```

### Augmenting the schema

Before the library calls `makeAugmentedSchema`, pass the type definitions into the Federation "plugin".
This will perform the following:

Adding in the opt-in for Federation:

```gql
extend schema @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@key", "@shareable"])
```

Return the `__resolveReference` resolvers.

Pass the "Federation augmented" type definitions into `makeAugmentedSchema` (something will break here)

Where we currently call `makeExecutableSchema`, add a conditional to check if Federation is enabled, and call `buildSubgraphSchema` if so.

In `validateDocument`, ignore `@link` and `@shareable`.

## Plugin implementation - using OGM

### Required lifecycle hooks

* Ability to add in directives to validate/ignore
* Modify `DocumentNode` before `makeAugmentedSchema`
* Add resolvers
* _Replace_ the schema return

## Slightly mad idea

Call `buildSubgraphSchema` on Federation package construction. Extract type definitions and resolvers.
Generate `__resolveReference` resolvers, merging them with extracted resolvers.
Return the augmented type definitions and merged resolvers.
