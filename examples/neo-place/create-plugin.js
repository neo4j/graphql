const { Neo4jGraphQLSubscriptionsAMQPPlugin } = require("@neo4j/graphql-plugin-subscriptions-amqp");
const { Neo4jGraphQLSubscriptionsSingleInstancePlugin } = require("@neo4j/graphql");
const { getEnvVariable } = require("./get-env-variable");

module.exports.createPlugin = async function () {
    const AMQP_URL = getEnvVariable("NEO_PLACE_AMQP_URL");

    let plugin;
    if (AMQP_URL) {
        plugin = new Neo4jGraphQLSubscriptionsAMQPPlugin({
            connection: AMQP_URL,
            reconnectTimeout: 1000,
        });
    } else {
        plugin = new Neo4jGraphQLSubscriptionsSingleInstancePlugin();
    }

    plugin.events.setMaxListeners(0);
    return plugin;
};
