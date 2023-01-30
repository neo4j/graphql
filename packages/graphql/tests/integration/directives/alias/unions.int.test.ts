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

import { gql } from "apollo-server";
import { Neo4jGraphQLAuthJWTPlugin } from "@neo4j/graphql-plugin-auth";
import type { Driver, Session } from "neo4j-driver";
import { graphql } from "graphql";
import Neo4j from "../../neo4j";
import { UniqueType } from "../../../utils/graphql-types";
import { Neo4jGraphQL } from "../../../../src/classes";
import { cleanNodes } from "../../../utils/clean-nodes";

describe("@alias directive", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    let session: Session;
    let neoSchema: Neo4jGraphQL;

    let typeMovie: UniqueType;
    let typeSeries: UniqueType;
    let typeActor: UniqueType;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    beforeEach(async () => {
        session = await neo4j.getSession();

        typeMovie = new UniqueType("Movie");
        typeSeries = new UniqueType("Series");
        typeActor = new UniqueType("Actor");

        const typeDefs = gql`
            type ${typeMovie.name} {
                title: String!
                titleAgain: String @alias(property: "title")
                isan: String! @unique
            }

            type ${typeSeries.name} {
                title: String!
                titleAgain: String @alias(property: "title")
                isan: String! @unique
            }

            union Production = ${typeMovie.name} | ${typeSeries.name}

            interface ActedIn @relationshipProperties {
                screentime: Int!
            }

            type ${typeActor.name} {
                name: String!
                nameAgain: String @alias(property: "name")
                actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }
        `;
        neoSchema = new Neo4jGraphQL({
            typeDefs,
            plugins: {
                auth: new Neo4jGraphQLAuthJWTPlugin({
                    secret: "secret",
                }),
            },
        });
    });

    afterEach(async () => {
        await cleanNodes(session, [typeMovie, typeSeries, typeActor]);
        await session.close();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("Create mutation with alias referring to existing field, include both fields as inputs - first rel type", async () => {
        const movieIsan = "0000-0000-03B6-0000-O-0000-0006-P";
        const seriesIsan = "0000-0001-ECC5-0000-8-0000-0001-B";

        const userMutation = `
            mutation {
                ${typeActor.operations.create}(
                    input: {
                        name: "Tom Hanks"
                        actedIn: {
                            ${typeMovie.name}: {
                                connectOrCreate: {
                                    where: { node: { isan: "${movieIsan}" } }
                                    onCreate: {
                                        edge: { screentime: 105 }
                                        node: { title: "Forrest Gump", titleAgain: "oops", isan: "${movieIsan}" }
                                    }
                                }
                            }
                            ${typeSeries.name}: {
                                connectOrCreate: {
                                    where: { node: { isan: "${seriesIsan}" } }
                                    onCreate: {
                                        edge: { screentime: 126 }
                                        node: {
                                            title: "Band of Brothers"
                                            isan: "${seriesIsan}"
                                        }
                                    }
                                }
                            }
                        }
                    }
                ) {
                    ${typeActor.plural} {
                        name
                    }
                }
            }
        `;

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: userMutation,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
        });

        expect(gqlResult.errors).toBeDefined();
        expect(gqlResult.errors).toHaveLength(1);
        expect(gqlResult.errors?.[0].message).toBe(
            `Conflicting modification of [[title]], [[titleAgain]] on type ${typeMovie.name}`
        );
        expect((gqlResult?.data as any)?.createDirectors?.directors).toBeUndefined();
    });
    test("Create mutation with alias referring to existing field, include both fields as inputs - second rel type", async () => {
        const movieIsan = "0000-0000-03B6-0000-O-0000-0006-P";
        const seriesIsan = "0000-0001-ECC5-0000-8-0000-0001-B";

        const userMutation = `
            mutation {
                ${typeActor.operations.create}(
                    input: {
                        name: "Tom Hanks"
                        actedIn: {
                            ${typeMovie.name}: {
                                connectOrCreate: {
                                    where: { node: { isan: "${movieIsan}" } }
                                    onCreate: {
                                        edge: { screentime: 105 }
                                        node: { title: "Forrest Gump", isan: "${movieIsan}" }
                                    }
                                }
                            }
                            ${typeSeries.name}: {
                                connectOrCreate: {
                                    where: { node: { isan: "${seriesIsan}" } }
                                    onCreate: {
                                        edge: { screentime: 126 }
                                        node: {
                                            title: "Band of Brothers",
                                            titleAgain: "oops",
                                            isan: "${seriesIsan}"
                                        }
                                    }
                                }
                            }
                        }
                    }
                ) {
                    ${typeActor.plural} {
                        name
                    }
                }
            }
        `;

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: userMutation,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
        });

        expect(gqlResult.errors).toBeDefined();
        expect(gqlResult.errors).toHaveLength(1);
        expect(gqlResult.errors?.[0].message).toBe(
            `Conflicting modification of [[title]], [[titleAgain]] on type ${typeSeries.name}`
        );
        expect((gqlResult?.data as any)?.createDirectors?.directors).toBeUndefined();
    });
    test("Create mutation alias referring to existing field, include only one field as inputs", async () => {
        const movieIsan = "0000-0000-03B6-0000-O-0000-0006-P";
        const seriesIsan = "0000-0001-ECC5-0000-8-0000-0001-B";

        const userMutation = `
            mutation {
                ${typeActor.operations.create}(
                    input: {
                        name: "Tom Hanks"
                        actedIn: {
                            ${typeMovie.name}: {
                                connectOrCreate: {
                                    where: { node: { isan: "${movieIsan}" } }
                                    onCreate: {
                                        edge: { screentime: 105 }
                                        node: { title: "Forrest Gump", isan: "${movieIsan}" }
                                    }
                                }
                            }
                            ${typeSeries.name}: {
                                connectOrCreate: {
                                    where: { node: { isan: "${seriesIsan}" } }
                                    onCreate: {
                                        edge: { screentime: 126 }
                                        node: {
                                            title: "Band of Brothers",
                                            isan: "${seriesIsan}"
                                        }
                                    }
                                }
                            }
                        }
                    }
                ) {
                    ${typeActor.plural} {
                        name
                    }
                }
            }
        `;

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: userMutation,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
        });

        expect(gqlResult.errors).toBeUndefined();
    });

    test("Create mutation with top-level connectOrCreate, alias referring to existing field, include only one field as inputs", async () => {
        const movieIsan = "0000-0000-03B6-0000-O-0000-0006-P";
        const seriesIsan = "0000-0001-ECC5-0000-8-0000-0001-B";

        const query = `
            mutation {
                ${typeActor.operations.update}(
                    update: {
                            name: "Tom Hanks"
                    },
                    connectOrCreate: {
                        actedIn: {
                            ${typeMovie.name}: {
                                where: { node: { isan: "${movieIsan}" } }
                                onCreate: {
                                    edge: { screentime: 105 }
                                    node: { title: "Forrest Gump", isan: "${movieIsan}" }
                                }
                            }
                            ${typeSeries.name}: {
                                where: { node: { isan: "${seriesIsan}" } }
                                onCreate: {
                                    edge: { screentime: 126 }
                                    node: {
                                        title: "Band of Brothers"
                                        isan: "${seriesIsan}"
                                    }
                                }
                            }
                        }
                }){
                    ${typeActor.plural} {
                        name
                    }
                }
            }
        `;

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
        });
        expect(gqlResult.errors).toBeUndefined();
    });
    test("Create mutation with top-level connectOrCreate, alias referring to existing field, include both fields as inputs - first rel type", async () => {
        const movieIsan = "0000-0000-03B6-0000-O-0000-0006-P";
        const seriesIsan = "0000-0001-ECC5-0000-8-0000-0001-B";

        const query = `
            mutation {
                ${typeActor.operations.update}(
                    update: {
                            name: "Tom Hanks"
                    },
                    connectOrCreate: {
                        actedIn: {
                            ${typeMovie.name}: {
                                where: { node: { isan: "${movieIsan}" } }
                                onCreate: {
                                    edge: { screentime: 105 }
                                    node: { title: "Forrest Gump", titleAgain: "oops", isan: "${movieIsan}" }
                                }
                            }
                            ${typeSeries.name}: {
                                where: { node: { isan: "${seriesIsan}" } }
                                onCreate: {
                                    edge: { screentime: 126 }
                                    node: {
                                        title: "Band of Brothers"
                                        isan: "${seriesIsan}"
                                    }
                                }
                            }
                        }
                }){
                    ${typeActor.plural} {
                        name
                    }
                }
            }
        `;

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
        });

        expect(gqlResult.errors).toBeDefined();
        expect(gqlResult.errors).toHaveLength(1);
        expect(gqlResult.errors?.[0].message).toBe(
            `Conflicting modification of [[title]], [[titleAgain]] on type ${typeMovie.name}`
        );
        expect((gqlResult?.data as any)?.[typeActor.operations.update]?.[typeActor.plural]).toBeUndefined();
    });
    test("Create mutation with top-level connectOrCreate, alias referring to existing field, include both fields as inputs - second rel type", async () => {
        const movieIsan = "0000-0000-03B6-0000-O-0000-0006-P";
        const seriesIsan = "0000-0001-ECC5-0000-8-0000-0001-B";

        const query = `
            mutation {
                ${typeActor.operations.update}(
                    update: {
                            name: "Tom Hanks"
                    },
                    connectOrCreate: {
                        actedIn: {
                            ${typeMovie.name}: {
                                where: { node: { isan: "${movieIsan}" } }
                                onCreate: {
                                    edge: { screentime: 105 }
                                    node: { title: "Forrest Gump", isan: "${movieIsan}" }
                                }
                            }
                            ${typeSeries.name}: {
                                where: { node: { isan: "${seriesIsan}" } }
                                onCreate: {
                                    edge: { screentime: 126 }
                                    node: {
                                        title: "Band of Brothers",
                                        titleAgain: "oops", 
                                        isan: "${seriesIsan}"
                                    }
                                }
                            }
                        }
                }){
                    ${typeActor.plural} {
                        name
                    }
                }
            }
        `;

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
        });

        expect(gqlResult.errors).toBeDefined();
        expect(gqlResult.errors).toHaveLength(1);
        expect(gqlResult.errors?.[0].message).toBe(
            `Conflicting modification of [[title]], [[titleAgain]] on type ${typeSeries.name}`
        );
        expect((gqlResult?.data as any)?.[typeActor.operations.update]?.[typeActor.plural]).toBeUndefined();
    });
    test("Create mutation with top-level connectOrCreate, alias referring to existing field, include both fields as inputs - update type", async () => {
        const movieIsan = "0000-0000-03B6-0000-O-0000-0006-P";
        const seriesIsan = "0000-0001-ECC5-0000-8-0000-0001-B";

        const query = `
            mutation {
                ${typeActor.operations.update}(
                    update: {
                            name: "Tom Hanks",
                            nameAgain: "oops"
                    },
                    connectOrCreate: {
                        actedIn: {
                            ${typeMovie.name}: {
                                where: { node: { isan: "${movieIsan}" } }
                                onCreate: {
                                    edge: { screentime: 105 }
                                    node: { title: "Forrest Gump", isan: "${movieIsan}" }
                                }
                            }
                            ${typeSeries.name}: {
                                where: { node: { isan: "${seriesIsan}" } }
                                onCreate: {
                                    edge: { screentime: 126 }
                                    node: {
                                        title: "Band of Brothers",
                                        isan: "${seriesIsan}"
                                    }
                                }
                            }
                        }
                }){
                    ${typeActor.plural} {
                        name
                    }
                }
            }
        `;

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
        });

        expect(gqlResult.errors).toBeDefined();
        expect(gqlResult.errors).toHaveLength(1);
        expect(gqlResult.errors?.[0].message).toBe(
            `Conflicting modification of [[name]], [[nameAgain]] on type ${typeActor.name}`
        );
        expect((gqlResult?.data as any)?.[typeActor.operations.update]?.[typeActor.plural]).toBeUndefined();
    });

    test("Update mutation alias referring to existing field, include only one field as inputs", async () => {
        const movieIsan = "0000-0000-03B6-0000-O-0000-0006-P";
        const seriesIsan = "0000-0001-ECC5-0000-8-0000-0001-B";

        const userMutation = `
        mutation {
            ${typeActor.operations.update}(
                update: {
                        name: "Tom Hanks"
                        actedIn: {
                            ${typeMovie.name}: {
                                connectOrCreate: {
                                    where: { node: { isan: "${movieIsan}" } }
                                    onCreate: {
                                        edge: { screentime: 105 }
                                        node: { title: "Forrest Gump", isan: "${movieIsan}" }
                                    }
                                }
                            }
                            ${typeSeries.name}: {
                                connectOrCreate: {
                                    where: { node: { isan: "${seriesIsan}" } }
                                    onCreate: {
                                        edge: { screentime: 126 }
                                        node: {
                                            title: "Band of Brothers"
                                            isan: "${seriesIsan}"
                                        }
                                    }
                                }
                            }
                        }
                    }
            ) {
                ${typeActor.plural} {
                    name
                }
            }
        }
    `;

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: userMutation,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
        });

        expect(gqlResult.errors).toBeUndefined();
    });
    test("Update mutation alias referring to existing field, include both fields as inputs - first rel type", async () => {
        const movieIsan = "0000-0000-03B6-0000-O-0000-0006-P";
        const seriesIsan = "0000-0001-ECC5-0000-8-0000-0001-B";

        const userMutation = `
        mutation {
            ${typeActor.operations.update}(
                update: {
                        name: "Tom Hanks"
                        actedIn: {
                            ${typeMovie.name}: {
                                connectOrCreate: {
                                    where: { node: { isan: "${movieIsan}" } }
                                    onCreate: {
                                        edge: { screentime: 105 }
                                        node: { title: "Forrest Gump", titleAgain: "oops", isan: "${movieIsan}" }
                                    }
                                }
                            }
                            ${typeSeries.name}: {
                                connectOrCreate: {
                                    where: { node: { isan: "${seriesIsan}" } }
                                    onCreate: {
                                        edge: { screentime: 126 }
                                        node: {
                                            title: "Band of Brothers"
                                            isan: "${seriesIsan}"
                                        }
                                    }
                                }
                            }
                        }
                    }
            ) {
                ${typeActor.plural} {
                    name
                }
            }
        }
    `;

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: userMutation,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
        });

        expect(gqlResult.errors).toBeDefined();
        expect(gqlResult.errors).toHaveLength(1);
        expect(gqlResult.errors?.[0].message).toBe(
            `Conflicting modification of [[title]], [[titleAgain]] on type ${typeMovie.name}`
        );
        expect((gqlResult?.data as any)?.[typeActor.operations.update]?.[typeActor.plural]).toBeUndefined();
    });
    test("Update mutation alias referring to existing field, include both fields as inputs - second rel type", async () => {
        const movieIsan = "0000-0000-03B6-0000-O-0000-0006-P";
        const seriesIsan = "0000-0001-ECC5-0000-8-0000-0001-B";

        const userMutation = `
        mutation {
            ${typeActor.operations.update}(
                update: {
                        name: "Tom Hanks"
                        actedIn: {
                            ${typeMovie.name}: {
                                connectOrCreate: {
                                    where: { node: { isan: "${movieIsan}" } }
                                    onCreate: {
                                        edge: { screentime: 105 }
                                        node: { title: "Forrest Gump", isan: "${movieIsan}" }
                                    }
                                }
                            }
                            ${typeSeries.name}: {
                                connectOrCreate: {
                                    where: { node: { isan: "${seriesIsan}" } }
                                    onCreate: {
                                        edge: { screentime: 126 }
                                        node: {
                                            title: "Band of Brothers",
                                            titleAgain: "oops", 
                                            isan: "${seriesIsan}"
                                        }
                                    }
                                }
                            }
                        }
                    }
            ) {
                ${typeActor.plural} {
                    name
                }
            }
        }
    `;

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: userMutation,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
        });

        expect(gqlResult.errors).toBeDefined();
        expect(gqlResult.errors).toHaveLength(1);
        expect(gqlResult.errors?.[0].message).toBe(
            `Conflicting modification of [[title]], [[titleAgain]] on type ${typeSeries.name}`
        );
        expect((gqlResult?.data as any)?.[typeActor.operations.update]?.[typeActor.plural]).toBeUndefined();
    });
    test("Update mutation alias referring to existing field, include both fields as inputs - update type", async () => {
        const movieIsan = "0000-0000-03B6-0000-O-0000-0006-P";
        const seriesIsan = "0000-0001-ECC5-0000-8-0000-0001-B";

        const userMutation = `
        mutation {
            ${typeActor.operations.update}(
                update: {
                        name: "Tom Hanks",
                        nameAgain: "oops", 
                        actedIn: {
                            ${typeMovie.name}: {
                                connectOrCreate: {
                                    where: { node: { isan: "${movieIsan}" } }
                                    onCreate: {
                                        edge: { screentime: 105 }
                                        node: { title: "Forrest Gump", isan: "${movieIsan}" }
                                    }
                                }
                            }
                            ${typeSeries.name}: {
                                connectOrCreate: {
                                    where: { node: { isan: "${seriesIsan}" } }
                                    onCreate: {
                                        edge: { screentime: 126 }
                                        node: {
                                            title: "Band of Brothers"
                                            isan: "${seriesIsan}"
                                        }
                                    }
                                }
                            }
                        }
                    }
            ) {
                ${typeActor.plural} {
                    name
                }
            }
        }
    `;

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: userMutation,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
        });

        expect(gqlResult.errors).toBeDefined();
        expect(gqlResult.errors).toHaveLength(1);
        expect(gqlResult.errors?.[0].message).toBe(
            `Conflicting modification of [[name]], [[nameAgain]] on type ${typeActor.name}`
        );
        expect((gqlResult?.data as any)?.[typeActor.operations.update]?.[typeActor.plural]).toBeUndefined();
    });
});
