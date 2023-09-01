---
"@neo4j/graphql": major
"@neo4j/graphql-ogm": major
---

Remove all arguments from IExecutableSchemaDefinition apart from `typeDefs` and `resolvers`. This is to simplify the API and to remove any unexpected behaviours from arguments which we blindly pass through.
