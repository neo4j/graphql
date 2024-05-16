import { cacheExchange, createClient, fetchExchange, subscriptionExchange } from "@urql/core";
import { createClient as createWSClient } from "graphql-ws";
import { pipe, subscribe } from "wonka";

// Low security auth
const JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.vVUnlsit1z9nnQJXIEwyFAj9NNflBUoeOpHP9MyzlCg";

module.exports = class GraphQLServerApi {
    constructor({ wsUrl, url }) {
        this.wsUrl = wsUrl;
        this.url = url;
        this._createClients();
    }

    async getCanvas() {
        const canvasQuery = /* GraphQL */ `
            query Canvas {
                canvas
            }
        `;
        const result = await this.client.query(canvasQuery).toPromise();
        if (result.error) throw new Error(result.error.message);
        return result.data.canvas;
    }

    updatePixel(position, color) {
        const updatePixelQuery = /* GraphQL */ `
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
                color,
            },
            where: {
                position,
            },
        };

        return this.client.mutation(updatePixelQuery, params).toPromise();
    }

    onConnected(cb) {
        this.wsClient.on("connected", (e) => {
            console.log("Connected", e);
            cb();
        });
    }

    onClosed(cb) {
        this.wsClient.on("error", (e) => {
            console.log("Error", e);
            cb();
        });
        this.wsClient.on("closed", (e) => {
            console.log("Closed", e);
            cb();
        });
    }

    onPixelUpdate(cb) {
        const pixelsSubscription = /* GraphQL */ `
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
                    cb(result.data.pixelUpdated);
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
                        const input = { ...request, query: request.query || "" };
                        return {
                            subscribe: (sink) => ({
                                unsubscribe: this.wsClient.subscribe(input, sink),
                            }),
                        };
                    },
                }),
            ],
            fetchOptions: {
                headers: {
                    Authorization: `Bearer ${JWT}`,
                },
            },
        });
    }
};
