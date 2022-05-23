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

    async getMovies() {
        const canvasQuery = gql`
        query Query {
          movies(options: {sort: [{title: ASC}]}) {
            title
            released
            tagline
          }
        }
        `;
        const result = await this.client
            .query(canvasQuery)
            .toPromise()
        if (result.error) throw new Error(result.error.message)
        return result.data.movies
    }

    updateMovie(title, field, value) {
        const updateMovieQuery = gql`
            mutation UpdateMovie($update: MovieUpdateInput, $where: MovieWhere) {
                updateMovies(update: $update, where: $where) {
                    movies {
                        title
                    }
                }
            }
        `;
        const params = {
            update: {
                [field]: value
            },
            where: {
                title
            },
        };

        return this.client.mutation(updateMovieQuery, params).toPromise();
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

    onMovieUpdate(where, cb) {
        const moviesSubscription = gql`
        subscription MovieSubscription($where: MovieSubscriptionWhere) {
          movieUpdated(where: $where) {
            updatedMovie {
              released
              tagline
            }
          }
        }
        `;

        const params = {
            where: {
                title: where
            }
        }

        pipe(
            this.client.subscription(moviesSubscription, params),
            subscribe((result) => {
                if (!result.error) {
                    cb(result.data.movieUpdated)
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
