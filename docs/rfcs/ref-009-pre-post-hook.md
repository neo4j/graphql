# Pre and Post Resolver Hooks

## Problem
Currently, [custom resolvers](https://neo4j.com/docs/graphql-manual/current/custom-resolvers/) completely override an existing resolver, meaning that users find hard extend the default behaviour of our resolvers without a great deal of effort. This has been raised on issue [#692](https://github.com/neo4j/graphql/issues/692) and could potentially be a workaround for issue [#716](https://github.com/neo4j/graphql/issues/716).

There is an existing [workaround](#Workaround) for this problem.

### Examples
These are some examples of the current behaviour of custom Resolvers, all examples use the following typedef:
```gql
type User {
    name: String!
}
```

**Overriding a query through type resolvers**
```ts
const resolvers = {
    User: {
        name(source) {
            return `My Name Is ${source.name}`;
        },
    },
};
```

When querying for users->name, the result is "My Name Is Arthur" (which is correct)

**Overriding a generated query directly**
```ts
    Query: {
        users(source) {
            // source is undefined here
            return [];
        },
    },
```

When querying for users, the custom resolver is completely overridden, with no query hitting the DB. This makes extending the behaviour in mutations hard

**Overriding a Mutation**

```typescript
Mutation: {
  createUsers(_source, {input}) {
    // This completely overrides the original mutation, requiring the user to perform the query and format the results manually 

    return {
      info: {
        nodesCreated: input.length,
      },
      users: input,
    };
  },
},
```

## Proposed Solution
Considering the following typedef:
```gql
type User {
    name: String!
}
```

### Proposal 1 - Hooks fields
The addition of optional **hooks** to be defined in JavaScript along with the custom resolvers.

A way to define custom hooks on the auto generated resolvers:

```ts
new Neo4jGraphQL({
	hooks: {
		createUsers: {
			pre(source, args, context){
				// Modify the input data
				return
			},
			post(result){
				// Do something before returning data
				return result
			}
		}
	}
	
})

```

**Pros**
* Allow for pre/post hooks, and any extra hooks we may need in the future.
* Better Typescript types.
* We can define the interface, including input/output and any helpers (e.g. Neo4j driver)

**Cons**
* Requires a `hooks` field that it is completely custom and extraneous to the GraphQL ecosystem.

#### Global Hooks

Alternatively, or additionally, hooks may be **global**, these hooks will execute for **every** top-level resolver, and it is up to the user to handle the behaviour depending on the resolver, if needed.

A way to define custom hooks on the auto generated resolvers:

```ts
new Neo4jGraphQL({
	hooks: {
		pre(source, args, context, info){
			// Modify the input data 
			switch(info.fieldName){
				case "createUsers":
					createUsersHook()
			}
			return context // TODO: check the return data
		},
		post(result){
			// Do something before returning data
			return result
		}
	}
	
})
```

### Proposal 2 - Next() interface
Using a _next_ interface within the resolvers.

```ts
new Neo4jGraphQL({
	resolvers: {
		Mutation {
		async createUsers(_source, args, context, info) {
			// Do pre execution stuff
			const result=await next(_source, args, context, info)
			// Do post execution stuff
			return result
		}
	}
	
})
```

This is similar to the approach taken by the `neo4j-graphql-js` library or the workaround using `graphql-middleware`. This workaround may make this approach no longer relevant.

**Pros**
* Close to the GraphQL way of doing things.

**Cons**
* Cannot add extra hooks (e.g. pre-cypher).
* Cannot add types, other than the default GraphQL types.
* The library loses control of workflow, may introduce some pitfalls to the users.

## Related work
In `neo4j-graphql-js` library, a function `neo4jgraphql` was available to be used along:
```ts
const resolvers = {
	Mutation: {
		createActor: async (_source, args, context, info) => {
		  console.log("I can add custom logic on top of the generated mutation thanks to the neo4jgraphql function below!")
		  return neo4jgraphql(_source, args, context, info);
		},
		deleteActors: async (_source, args, context, info) => {
			console.log("I can add custom logic on top of the generated mutation thanks to the neo4jgraphql function below!")
			return neo4jgraphql(_source, args, context, info);
		}
	},
};
```

* The example [custom-resolvers](https://neo4j.com/docs/graphql-manual/current/ogm/examples/custom-resolvers/) of the OGM shows an example of creating custom mutations with resolvers.

### Workaround
A valid workaround for this problem is available [here](https://github.com/neo4j/graphql/issues/692#issuecomment-1017081173) using [graphql-middleware](https://www.npmjs.com/package/graphql-middleware).

## Out of Scope
* Cypher hooks are covered in a [separate RFC](https://github.com/neo4j/graphql/pull/836)
* Custom Cypher through the OGM mentioned in issue [716](https://github.com/neo4j/graphql/issues/716)
