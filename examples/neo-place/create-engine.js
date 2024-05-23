const { Neo4jGraphQLAMQPSubscriptionsEngine } = require("@neo4j/graphql-amqp-subscriptions-engine");
const { getEnvVariable } = require("./get-env-variable");

module.exports.createEngine = async function () {
    const AMQP_URL = getEnvVariable("NEO_PLACE_AMQP_URL");

    if (AMQP_URL) {
        engine = new Neo4jGraphQLAMQPSubscriptionsEngine({
            connection: AMQP_URL,
            reconnectTimeout: 1000,
        });
        engine.events.setMaxListeners(0);
        return engine;
    }
};
