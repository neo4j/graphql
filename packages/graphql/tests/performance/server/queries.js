export const queries = {
    simpleQuery: `#graphql
        query SimpleQuery {
            movies( limit: 10) {
                title
            }
        }
    `,
    highComplexityQueryWithLimit: `#graphql
        query highComplexityQueryWithLimit {
            movies( sort: { title: DESC }, limit: 10) {
                released
                tagline
                title
                actors( sort: { name: DESC }, limit: 2) {
                    name
                    movies( sort: { title: DESC }, limit: 2) {
                        released
                        tagline
                        title
                        actors(sort: {name: DESC}, limit: ) {
                            name
                            movies( sort: { title: DESC }, limit: 2) {
                                released
                                tagline
                                title
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
                            }
                        }
                    }
                }
            }
        }
    `,
};
