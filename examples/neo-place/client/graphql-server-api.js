import {
    createClient,
    defaultExchanges,
    subscriptionExchange,
    gql
} from "urql";
import {
    pipe,
    subscribe
} from "wonka";
import {
    createClient as createWSClient
} from "graphql-ws";

module.exports = class GraphQLServerApi {

    constructor({
        wsUrl,
        url,
    }) {
        this.wsUrl = wsUrl;
        this.url = url;
        this._createClients();
    }

    async getCanvas() {
        const canvasQuery = gql`
            query Canvas {
                canvas
            }
        `;

        const result = await this.client
            .query(canvasQuery)
            .toPromise()
        return result.data.canvas
    }

    updatePixel(position, color) {
        const updatePixelQuery = gql`
            mutation UpdatePixels($update: PixelUpdateInput, $where: PixelWhere) {
                updatePixels(update: $update, where: $where) {
                    pixels {
                        position
                        color
                    }
                }
            }
        `;
        const params = {
            update: {
                color
            },
            where: {
                position
            },
        };

        return this.client.mutation(updatePixelQuery, params).toPromise();
    }

    onConnected(cb) {
        this.wsClient.on("connected", () => {
            cb()
        })
    }

    onPixelUpdate(cb) {
        const pixelsSubscription = gql`
            subscription Subscription {
                pixelUpdated {
                    updatedPixel {
                        position
                        color
                    }
                }
            }
        `;

        pipe(
            this.client.subscription(pixelsSubscription),
            subscribe((result) => {
                if (!result.error) {
                    cb(result.data.pixelUpdated)
                }
            })
        );
    }

    _createClients() {
        this.wsClient = createWSClient({
            url: this.wsUrl,
        });



        this.client = createClient({
            url: "/graphql",
            exchanges: [
                ...defaultExchanges,
                subscriptionExchange({
                    forwardSubscription: (operation) => ({
                        subscribe: (sink) => ({
                            unsubscribe: this.wsClient.subscribe(operation, sink),
                        }),
                    }),
                }),
            ],
        });
    }
}
