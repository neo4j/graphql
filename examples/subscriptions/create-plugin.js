const { EventEmitter } = require("events");

module.exports.createPlugin = async function () {
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
