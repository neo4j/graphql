const { Neo4jGraphQLSubscriptionsAMQP } = require("@neo4j/graphql-plugin-subscriptions-amqp");
const { EventEmitter } = require("events");
const { getSecret } = require("./get-secret");

module.exports.createPlugin = async function () {
    if (process.env.NODE_ENV === "production") {
        const plugin = new Neo4jGraphQLSubscriptionsAMQP();
        plugin.events.setMaxListeners(0);
        setInterval(()=>{
            console.log("Events Connections", plugin.events.listenerCount("update"))
        }, 5000);

        const url = await getSecret("team-graphql", "NEO_PLACE_AMQP_URL");

        await plugin.connect(url);

        return plugin;
    }

    class SubscriptionsPlugin {
        constructor() {
            this.events = new EventEmitter();
            this.events.setMaxListeners(0);
            setInterval(()=>{
                console.log("Events Connections", this.events.listenerCount("update"))
            }, 5000);

        }

        publish(eventMeta) {
            this.events.emit(eventMeta.event, eventMeta);
        }
    }

    return new SubscriptionsPlugin();
};
