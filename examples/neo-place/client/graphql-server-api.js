import {
    createClient,
    cacheExchange,
    fetchExchange,
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

// Low security auth
const JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.vVUnlsit1z9nnQJXIEwyFAj9NNflBUoeOpHP9MyzlCg";

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
        if (result.error) throw new Error(result.error.message)
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
            cb();
        })
    }

    onClosed(cb) {
        this.wsClient.on("error", () => {
            cb();
        });
        this.wsClient.on("closed", () => {
            cb();
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
            connectionParams: {
                authorization: `Bearer ${JWT}`,
            },
        });



        this.client = createClient({
            url: this.url,
            exchanges: [
                cacheExchange,
                fetchExchange,
                subscriptionExchange({
                    forwardSubscription: (request) => {
                        const input = { ...request, query: request.query || '' };
                        return {
                            subscribe: (sink) => ({
                                unsubscribe: this.wsClient.subscribe(input, sink),
                            }),
                        }
                    },
                }),
            ],
            fetchOptions: {
                headers: {
                    Authorization: `Bearer ${JWT}`
                }
            }
        });
    }
}
