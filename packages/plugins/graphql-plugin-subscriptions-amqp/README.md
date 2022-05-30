# @neo4j/graphql-plugin-subscriptions-amqp

Subscription plugin for `@neo4j/graphql`, currently supporting AMQP 0-9-1 brokers such as:

-   RabbitMQ
-   Apache Qpid
-   Apache ActiveMQ

1. [Documentation](https://neo4j.com/docs/graphql-manual/current/subscriptions/)

## Installation

```
npm install @neo4j/graphql-plugin-subscriptions-amqp
```

## Usage

```javascript
const { Neo4jGraphQLSubscriptionsAMQPPlugin } = require("@neo4j/graphql-plugin-subscriptions-amqp");

const plugin = new Neo4jGraphQLSubscriptionsAMQPPlugin({
    connection: {
        hostname: "localhost",
        username: "guest",
        password: "guest",
    },
});

const neoSchema = new Neo4jGraphQL({
    typeDefs,
    driver,
    plugins: {
        subscriptions: plugin,
    },
});
```

To close the connection with RabbitMQ:

```javascript
await plugin.close();
```

## Running tests

-   `yarn test` to run unit tests
-   `yarn test:e2e` to run integration tests. These tests require a RabbitMQ instance running, and are not run by default
    -   Use `docker-compose up rabbitmq` to spin up a RabbitMQ container for testing
    -   Use `docker-compose up qpid` to spin up a Qpid container for testing

## Licence

[Apache 2.0](https://github.com/neo4j/graphql/blob/master/packages/graphql-plugin-auth/LICENSE.txt)
