# Neo4j/GraphQL Subscriptions with Apollo and RabbitMQ

This example application runs GraphQL subscriptions over a Neo4j database using the GraphQL Library for Neo4j on a [Apollo](https://www.apollographql.com/) server and [RabbitMQ](https://www.rabbitmq.com/) queue to provide production-ready scalability.

To run this demo:

1. Run `npm install`
2. Make sure the variables `NEO4J_URL`, `NEO4J_USER` and `NEO4J_PASSWORD` in `server.js` are set to you Neo4j database.
3. Make sure the variable `AMQP_URI` is set to a running RabbitMQ server (or any AMQP "0-9-1" server).
    - Check [Running RabbitMQ](#running-rabbitmq) for instructions on running a demo RabbitMQ server.
    - For a simple development server, check on the instructions for [running without rabbitMQ](#running-without-rabbitmq).
4. Run `npm start`
5. Go to `localhost:4000/graphql`

Some example queries can be found at `examples.graphql`

## Running RabbitMQ

For testing purposes, RabbitMQ can be run with the provided `docker-compose.yml` file by executing:

```
docker-compose up rabbitmq
```

Note that you need both [Docker](https://docs.docker.com/) and [Docker-compose](https://docs.docker.com/compose/) installed to run it this way.

## Running without RabbitMQ

If you are building a local dev server, you can run this demo without RabbitMQ, by using a local event system. To do this replacing the plugin setup in `server.js` from:

```js
const plugin = new Neo4jGraphQLSubscriptionsAMQPPlugin({
    connection: AMQP_URI,
});
```

To

```js
const plugin = new new Neo4jGraphQLSubscriptionsSingleInstancePlugin()();
```

And update the `neo4j/graphql` import to:

```js
const { Neo4jGraphQL, Neo4jGraphQLSubscriptionsSingleInstancePlugin } = require("@neo4j/graphql");
```
