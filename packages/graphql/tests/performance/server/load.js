//k6 run --vus 1000 --duration 10s load.js

// eslint-disable-next-line import/no-unresolved
import http from "k6/http";
// eslint-disable-next-line import/no-unresolved
import { sleep } from "k6";

const maxVus = 5000;
export const options = {
    startVUs: 0,
    stages: [
        { duration: "5s", target: maxVus },
        { duration: "10s", target: maxVus },
        { duration: "10s", target: 0 },
    ],
};

export default function () {
    const query = `
        query ConnectionWithSortAndCypher {
            moviesConnection(first: 5, sort: [{ title: ASC }, { oneActorName: DESC }]) {
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
    `;
    const simpleQuery = `
        query {
            movies(where: { title_CONTAINS: "Sharknado" }, options: { sort: { title: ASC }, limit: 25 }) {
                title
                actors(options: { sort: { name: DESC }, limit: 10 }) {
                    name
                }
            }
        }
    `;
    const simpleMovie = `
    query Movies {
        movies(options: {limit: 10}) {
          title
        }
      }
    `;

    const highComplexityQueryWithLimit = `
    query HighComplexityQuery {
        movies(options: {sort: {title: DESC}, limit: 10}) {
            released
            tagline
            title
            actors(options: {sort: {name: DESC}, limit: 2}) {
                name
                movies(options: {sort: {title: DESC}, limit: 2}) {
                    released
                    tagline
                    title
                    actors {
                        name
                        movies(options: {sort: {title: DESC}, limit: 2}) {
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
    `;
    const highComplexityQuery = `
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
    `;

    const headers = {
        "Content-Type": "application/json",
    };
    http.post("http://localhost:4000/graphql", JSON.stringify({ query: simpleQuery }), { headers: headers });
    // TODO: check
    // check(res, { 'status was 200': (r) => r.status == 200 });
    sleep(0.3);
}
