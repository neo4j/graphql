const { Neo4jGraphQLSubscriptionsAMQP } = require("@neo4j/graphql-plugin-subscriptions-amqp");
const { EventEmitter } = require("events");
const { getSecret } = require("./get-secret");

module.exports.getPlugin = async function () {
    if (process.env.NODE_ENV === "production") {
        const plugin = new Neo4jGraphQLSubscriptionsAMQP();

        const password = await getSecret("team-graphql", "NEO_PLACE_RABBITMQ_PASSWORD");
        const url = await getSecret("team-graphql", "NEO_PLACE_RABBITMQ_URL");

        await plugin.connect(`amqp://rabbit:${password}@${url}`);

        return plugin;
    }

    class SubscriptionsPlugin {
        constructor() {
            this.events = new EventEmitter();
        }

        publish(eventMeta) {
            this.events.emit(eventMeta.event, eventMeta);
        }
    }

    return new SubscriptionsPlugin();
};
