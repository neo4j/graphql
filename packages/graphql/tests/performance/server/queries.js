export const queries = {
    simpleQuery: `#graphql
        query SimpleQuery {
            movies(options: { limit: 10 }) {
                title
            }
        }
    `,
    highComplexityQueryWithLimit: `#graphql
        query highComplexityQueryWithLimit {
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
                        actors(options: {sort: {name: DESC}, limit: 2}) {
                            name
                            movies(options: { sort: { title: DESC }, limit: 2 }) {
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
