/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 *
 * This file is part of Neo4j.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Driver } from "neo4j-driver";
import { graphql } from "graphql";
import { generate } from "randomstring";
import { gql } from "apollo-server";
import neo4j from "./neo4j";
import { Neo4jGraphQL } from "../../src/classes";

describe("default relationship options", () => {
    let driver: Driver;

    const typeDefs = gql`
        union Person = Director | Actor

        type Director {
            name: String!
        }

        type Actor {
            name: String!
        }

        type Movie {
            people(options: QueryOptions = { limit: 1 }): [Person!]! @relationship(type: "HAS_PERSON", direction: OUT)
            title: String!
            genres(options: GenreOptions = { sort: { name: ASC }, limit: 3 }): [Genre!]!
                @relationship(type: "IN_GENRE", direction: OUT)
        }

        type Genre {
            name: String!
            series(options: SeriesOptions = { sort: [{ name: DESC }] }): [Series!]!
                @relationship(type: "IN_SERIES", direction: OUT)
        }

        type Series {
            name: String!
        }
    `;

    const { schema } = new Neo4jGraphQL({ typeDefs });

    const title = generate({
        charset: "alphabetic",
    });

    const director = generate({
        charset: "alphabetic",
    });

    const actor1 = generate({
        charset: "alphabetic",
    });

    const actor2 = generate({
        charset: "alphabetic",
    });

    const genreName1 = "genreA";
    const genreName2 = "genreB";
    const genreName3 = "genreC";
    const genreName4 = "genreD";

    const series1 = "seriesA";
    const series2 = "seriesB";

    beforeAll(async () => {
        driver = await neo4j();
        const session = driver.session();
        await session.run(
            `
                CREATE (movie: Movie {title: $title})
                CREATE (:Director {name: $director})<-[:HAS_PERSON]-(movie)
                CREATE (:Actor {name: $actor1})<-[:HAS_PERSON]-(movie)
                CREATE (:Actor {name: $actor2})<-[:HAS_PERSON]-(movie)
                CREATE (genre1:Genre {name: $genreName1})<-[:IN_GENRE]-(movie)
                CREATE (:Genre {name: $genreName2})<-[:IN_GENRE]-(movie)
                CREATE (:Genre {name: $genreName3})<-[:IN_GENRE]-(movie)
                CREATE (:Genre {name: $genreName4})<-[:IN_GENRE]-(movie)
                CREATE (:Series {name: $series1})<-[:IN_SERIES]-(genre1)
                CREATE (:Series {name: $series2})<-[:IN_SERIES]-(genre1)
            `,
            {
                title,
                director,
                actor1,
                actor2,
                genreName1,
                genreName2,
                genreName3,
                genreName4,
                series1,
                series2,
            }
        );
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should use default options on field", async () => {
        const query = gql`
            query($title: String!) {
                movies(where: { title: $title }) {
                    genres {
                        name
                    }
                }
            }
        `;

        const graphqlResult = await graphql({
            schema,
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            source: query.loc!.source,
            contextValue: { driver },
            variableValues: { title },
        });

        expect(graphqlResult.errors).toBeUndefined();

        const graphqlMovie = graphqlResult.data?.movies[0];

        expect(graphqlMovie).toBeDefined();

        expect(graphqlMovie).toEqual({
            genres: [{ name: genreName1 }, { name: genreName2 }, { name: genreName3 }],
        });
    });

    test("should override default options on field", async () => {
        const query = gql`
            query($title: String!) {
                movies(where: { title: $title }) {
                    genres(options: { sort: { name: DESC } }) {
                        name
                    }
                }
            }
        `;

        const graphqlResult = await graphql({
            schema,
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            source: query.loc!.source,
            contextValue: { driver },
            variableValues: { title },
        });

        expect(graphqlResult.errors).toBeUndefined();

        const graphqlMovie = graphqlResult.data?.movies[0];

        expect(graphqlMovie).toBeDefined();

        expect(graphqlMovie).toEqual({
            genres: [{ name: genreName4 }, { name: genreName3 }, { name: genreName2 }, { name: genreName1 }],
        });
    });

    test("should use default options on union field", async () => {
        const query = gql`
            query($title: String!) {
                movies(where: { title: $title }) {
                    people {
                        ... on Actor {
                            name
                        }
                    }
                }
            }
        `;

        const graphqlResult = await graphql({
            schema,
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            source: query.loc!.source,
            contextValue: { driver },
            variableValues: { title },
        });

        expect(graphqlResult.errors).toBeUndefined();

        const graphqlMovie = graphqlResult.data?.movies[0];

        expect(graphqlMovie).toBeDefined();

        expect(graphqlMovie.people).toHaveLength(1);
    });

    test("should use default options on nested field", async () => {
        const query = gql`
            query($title: String!) {
                movies(where: { title: $title }) {
                    genres {
                        name
                        series {
                            name
                        }
                    }
                }
            }
        `;

        const graphqlResult = await graphql({
            schema,
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            source: query.loc!.source,
            contextValue: { driver },
            variableValues: { title },
        });

        expect(graphqlResult.errors).toBeUndefined();

        const graphqlMovie = graphqlResult.data?.movies[0];

        expect(graphqlMovie).toBeDefined();

        expect(graphqlMovie).toEqual({
            genres: [
                { name: genreName1, series: [{ name: series2 }, { name: series1 }] },
                { name: genreName2, series: [] },
                { name: genreName3, series: [] },
            ],
        });
    });
});
