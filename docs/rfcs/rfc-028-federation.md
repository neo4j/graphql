# Federation

Requirements:

* Depends on package `@apollo/subgraph`
* Opt into Federation in schema using `extend schema @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@key", "@shareable"])`
* Needs to be able to accept the `@key` directive on types
* Whenever we see a `@key` directive, add a `__resolveReference` resolver for that type
* Returns a schema by running `buildSubgraphSchema` from `@apollo/subgraph`

## Solution - PoC plugin using the OGM for resolution

This will be a new package, depending on `@neo4j/graphql-ogm` and `@apollo/subgraph`. A new "plugin" slot will be added alongside `auth` and `subscriptions` for this to be added into the library. It will provide the resolver signature which can be used to inject the `__resolveReference` resolvers into the schema. It will provide the schema extension needed to enable Federation. It will provide a rudimentary way of fetching the schema returned by `buildSubgraphSchema`.

### Resolver signature

```ts
function getResolveReference(__typename: string) {
    const __resolveReference = async (reference, context) => {
        const model = this.ogm.model(__typename);
        return model.find({ where: reference, context });
    }

    return __resolveReference;
}
```

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

### Extending the schema

Add in the opt-in for Federation:

```gql
extend schema @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@key", "@shareable"])
```

### Schema validation

If the Federation plugin is enabled, ignore `@link` and `@shareable` in `validateDocument`.

### Schema generation

Where we currently call `makeExecutableSchema`, add a conditional to check if Federation is enabled, and fetch the schema from the Federation plugin if so.

## Solution - plugin using OGM, generic using lifecycle hooks

### Required lifecycle hooks

* Ability to add in directives to validate/ignore
* Modify `DocumentNode` before `makeAugmentedSchema`
* Add resolvers
* _Replace_ the schema return

### Concept for how to get schema from `buildSubgraphSchema` without replacing the schema generation

Call `buildSubgraphSchema` on Federation package construction. Extract type definitions and resolvers.
Generate `__resolveReference` resolvers, merging them with extracted resolvers.
Return the augmented type definitions and merged resolvers.
