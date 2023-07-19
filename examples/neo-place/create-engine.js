const { Neo4jGraphQLSubscriptionsAMQPEngine } = require("@neo4j/graphql-subscriptions-engine-amqp");
const { getEnvVariable } = require("./get-env-variable");

module.exports.createEngine = async function () {
    const AMQP_URL = getEnvVariable("NEO_PLACE_AMQP_URL");

    if (AMQP_URL) {
        engine = new Neo4jGraphQLSubscriptionsAMQPEngine({
            connection: AMQP_URL,
            reconnectTimeout: 1000,
        });
        engine.events.setMaxListeners(0);
        return engine
    }
};
