# @neo4j/graphql-plugin-subscriptions-amqp

Subscription plugin for `@neo4j/graphql`, currently supporting AMQP 0-9-1 brokers such as:

-   RabbitMQ
-   Apache Qpid
-   Apache ActiveMQ

[Documentation](https://neo4j.com/docs/graphql-manual/current/subscriptions/)

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

## Options

The following options are available in the plugin.

-   **connection**: [AMQP](https://www.npmjs.com/package/amqplib) connection options or amqp url (e.g. `amqp://localhost`).
-   **exchange**: (optional) Queue exchange, defaults to `neo4j.graphql.subscriptions.fx`.
-   **reconnectTimeout**: (optional) Timeout (in ms) between reconnection attempts. If not set, the plugin will not reconnect. Note that if the first connection fails, it will not attempt to reconnect.
-   **log**: (optional) Enable AMQP logs, defaults to `true`.
-   **amqpVersion**: (optional) AMQP version to use, only `0-9-1` supported at the moment.

## Running tests

-   `yarn test` to run unit tests
-   `yarn test:e2e` to run integration tests. These tests require a RabbitMQ instance running, and are not run by default
    -   Use `docker-compose up rabbitmq` to spin up a RabbitMQ container for testing
    -   Use `docker-compose up qpid` to spin up a Qpid container for testing

## Licence

[Apache 2.0](https://github.com/neo4j/graphql/blob/master/packages/graphql-plugin-auth/LICENSE.txt)
