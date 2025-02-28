---
"@neo4j/graphql": major
---

Remove `publish` method from `Neo4jGraphQLSubscriptionsEngine` interface as it is no longer used with CDC-based subscriptions. Implementing this method on custom engines will no longer have an effect, and it is no longer possible to call `publish` directly on `Neo4jGraphQLSubscriptionsCDCEngine`
