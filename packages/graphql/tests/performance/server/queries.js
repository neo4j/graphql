export const queries = {
    connectionWithSortAndCypher: `#graphql
        query ConnectionWithSortAndCypher {
            moviesConnection(first: 15, sort: [{ title: ASC }, { oneActorName: DESC }]) {
                edges {
                    node {
                        title
                        oneActorName
                        actorsConnection {
                            edges {
                                node {
                                    name
                                }
                            }
                        }
                    }
                }
            }
        }
    `,
    nestedQueryWithLimit: `#graphql
        query NestedQueryWithLimit {
            movies(where: { title_CONTAINS: "Sharknado" }, options: { sort: { title: ASC }, limit: 25 }) {
                title
                actors(options: { sort: { name: DESC }, limit: 10 }) {
                    name
                }
            }
        }
    `,
    simpleQuery: `#graphql
        query SimpleQuery {
            movies(options: { limit: 10 }) {
                title
            }
        }
    `,
    highComplexityQueryWithLimit: `#graphql
        query HighComplexityQuery {
            movies(options: { sort: { title: DESC }, limit: 10 }) {
                released
                tagline
                title
                actors(options: { sort: { name: DESC }, limit: 2 }) {
                    name
                    movies(options: { sort: { title: DESC }, limit: 2 }) {
                        released
                        tagline
                        title
                        actors {
                            name
                            movies(options: { sort: { title: DESC }, limit: 2 }) {
                                released
                                tagline
                                title
                                actors {
                                    name
                                }
                            }
                        }
                    }
                }
            }
        }
    `,
    highComplexityQuery: `#graphql
        query HighComplexityQuery {
            movies {
                released
                tagline
                title
                actors {
                    name
                    movies {
                        released
                        tagline
                        title
                        actors {
                            name
                            movies {
                                released
                                tagline
                                title
                                actors {
                                    name
                                }
                            }
                        }
                    }
                }
            }
        }
    `,
};
