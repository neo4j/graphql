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

import type { Driver } from "neo4j-driver";
import supertest from "supertest";
import { Neo4jGraphQL } from "../../../../src/classes";
import { UniqueType } from "../../../utils/graphql-types";
import type { TestGraphQLServer } from "../../setup/apollo-server";
import { ApolloTestServer } from "../../setup/apollo-server";
import { TestSubscriptionsPlugin } from "../../../utils/TestSubscriptionPlugin";
import { WebSocketTestClient } from "../../setup/ws-client";
import Neo4j from "../../setup/neo4j";
import { cleanNodes } from "../../../utils/clean-nodes";
import { delay } from "../../../../src/utils/utils";

describe("Connect Subscription with optional filters valid for all types", () => {
    let neo4j: Neo4j;
    let driver: Driver;
    let server: TestGraphQLServer;
    let wsClient: WebSocketTestClient;
    let wsClient2: WebSocketTestClient;
    let typePerson: UniqueType;
    let typeArticle: UniqueType;
    let typeDefs: string;

    beforeEach(async () => {
        typePerson = new UniqueType("Person");
        typeArticle = new UniqueType("Article");

        typeDefs = `
            type ${typePerson} {
                name: String!
                knownBy: [${typePerson}!]! @relationship(type: "KNOWN_BY", direction: IN, properties: "Knows")
            }

            interface Knows @relationshipProperties {
                year: Int!
            }
            
            type ${typeArticle} {
                title: String!
                references: [${typeArticle}!]! @relationship(type: "REFERENCES", direction: OUT, properties: "Reference")
            }
            interface Reference @relationshipProperties {
                year: Int!
                edition: Int!
            }
        `;

        neo4j = new Neo4j();
        driver = await neo4j.getDriver();

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            driver,
            config: {
                driverConfig: {
                    database: neo4j.getIntegrationDatabaseName(),
                },
            },
            features: {
                subscriptions: new TestSubscriptionsPlugin(),
            },
        });
        server = new ApolloTestServer(neoSchema);
        await server.start();

        wsClient = new WebSocketTestClient(server.wsPath);
        wsClient2 = new WebSocketTestClient(server.wsPath);
    });

    afterEach(async () => {
        await wsClient.close();
        await wsClient2.close();

        const session = driver.session();
        await cleanNodes(session, [typePerson, typeArticle]);

        await server.close();
        await driver.close();
    });

    const articleSubscriptionQuery = ({ typeArticle, where }) => `
subscription SubscriptionMovie {
    ${typeArticle.operations.subscribe.relationship_created}(where: ${where}) {
        relationshipFieldName
        event
        ${typeArticle.operations.subscribe.payload.relationship_created} {
            title
        }
        createdRelationship {
            references {
                edition
                year
                node {
                    title
                }
            }
        }
    }
}
`;

    const personSubscriptionQuery = ({ typePerson, where }) => `
subscription SubscriptionMovie {
    ${typePerson.operations.subscribe.relationship_created}(where: ${where}) {
        relationshipFieldName
        event
        ${typePerson.operations.subscribe.payload.relationship_created} {
            name
        }
        createdRelationship {
            knownBy {
                year
                node {
                    name
                }
            }
        }
    }
}
`;

    test("node relationship to self - standard type - OUT", async () => {
        const where = `{createdRelationship: {references: {node: {title_IN: ["art"]}}}}`;

        // const where = `{createdRelationship: {references: {node: {title_NOT_IN: ["a"]}}}}`;
        await wsClient.subscribe(articleSubscriptionQuery({ typeArticle, where }));

        await supertest(server.path)
            .post("")
            .send({
                query: `
                    mutation {
                        ${typeArticle.operations.create}(
                            input: [
                                {
                                    references: {
                                        create: [
                                            {
                                                node: {
                                                    title: "art"
                                                },
                                                edge: {
                                                    year: 2020,
                                                    edition: 1
                                                }
                                            },
                                            {
                                                node: {
                                                    title: "art2"
                                                },
                                                edge: {
                                                    year: 2010,
                                                    edition: 2
                                                }
                                            }
                                        ]
                                    },
                                    title: "articol",
                                }
                            ]
                        ) {
                            ${typeArticle.plural} {
                                title
                            }
                        }
                    }
                `,
            })
            .expect(200);

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toHaveLength(1);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeArticle.operations.subscribe.relationship_created]: {
                    [typeArticle.operations.subscribe.payload.relationship_created]: { title: "articol" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "references",
                    createdRelationship: {
                        references: {
                            year: 2020,
                            edition: 1,
                            node: {
                                title: "art",
                            },
                        },
                    },
                },
            },
        ]);
    });

    test("node relationship to self - standard type - by connected field expecting none - OUT", async () => {
        const where = `{${typeArticle.operations.subscribe.payload.relationship_created}: {title_IN: ["art"]}}`;
        await wsClient.subscribe(articleSubscriptionQuery({ typeArticle, where }));

        await supertest(server.path)
            .post("")
            .send({
                query: `
                    mutation {
                        ${typeArticle.operations.create}(
                            input: [
                                {
                                    references: {
                                        create: [
                                            {
                                                node: {
                                                    title: "art"
                                                },
                                                edge: {
                                                    year: 2020,
                                                    edition: 1
                                                }
                                            },
                                            {
                                                node: {
                                                    title: "art2"
                                                },
                                                edge: {
                                                    year: 2010,
                                                    edition: 2
                                                }
                                            }
                                        ]
                                    },
                                    title: "articol",
                                }
                            ]
                        ) {
                            ${typeArticle.plural} {
                                title
                            }
                        }
                    }
                `,
            })
            .expect(200);

        // forcing a delay to ensure events do not exist
        await delay(4);
        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toHaveLength(0);
    });

    test("node relationship to self - standard type - by connected field - OUT", async () => {
        const where = `{${typeArticle.operations.subscribe.payload.relationship_created}: {title_IN: ["articol"]}}`;
        await wsClient.subscribe(articleSubscriptionQuery({ typeArticle, where }));

        await supertest(server.path)
            .post("")
            .send({
                query: `
                    mutation {
                        ${typeArticle.operations.create}(
                            input: [
                                {
                                    references: {
                                        create: [
                                            {
                                                node: {
                                                    title: "art"
                                                },
                                                edge: {
                                                    year: 2020,
                                                    edition: 1
                                                }
                                            },
                                            {
                                                node: {
                                                    title: "art2"
                                                },
                                                edge: {
                                                    year: 2010,
                                                    edition: 2
                                                }
                                            }
                                        ]
                                    },
                                    title: "articol",
                                }
                            ]
                        ) {
                            ${typeArticle.plural} {
                                title
                            }
                        }
                    }
                `,
            })
            .expect(200);

        await wsClient.waitForEvents(2);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toHaveLength(2);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeArticle.operations.subscribe.relationship_created]: {
                    [typeArticle.operations.subscribe.payload.relationship_created]: { title: "articol" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "references",
                    createdRelationship: {
                        references: {
                            year: 2020,
                            edition: 1,
                            node: {
                                title: "art",
                            },
                        },
                    },
                },
            },
            {
                [typeArticle.operations.subscribe.relationship_created]: {
                    [typeArticle.operations.subscribe.payload.relationship_created]: { title: "articol" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "references",
                    createdRelationship: {
                        references: {
                            year: 2010,
                            edition: 2,
                            node: {
                                title: "art2",
                            },
                        },
                    },
                },
            },
        ]);
    });

    test("node relationship to self - standard type - inverse - OUT", async () => {
        const where = `{createdRelationship: {references: {node: {title_IN: ["articol"]}}}}`;
        await wsClient.subscribe(articleSubscriptionQuery({ typeArticle, where }));

        await supertest(server.path)
            .post("")
            .send({
                query: `
                    mutation {
                        ${typeArticle.operations.create}(
                            input: [
                                {
                                    references: {
                                        create: [
                                            {
                                                node: {
                                                    title: "art"
                                                },
                                                edge: {
                                                    year: 2020,
                                                    edition: 1
                                                }
                                            },
                                            {
                                                node: {
                                                    title: "art2"
                                                },
                                                edge: {
                                                    year: 2010,
                                                    edition: 2
                                                }
                                            }
                                        ]
                                    },
                                    title: "articol",
                                }
                            ]
                        ) {
                            ${typeArticle.plural} {
                                title
                            }
                        }
                    }
                `,
            })
            .expect(200);

        // forcing a delay to ensure events do not exist
        await delay(4);
        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toHaveLength(0);
    });

    test("node relationship to self - standard type - IN", async () => {
        const where = `{createdRelationship: {knownBy: {node: {name_IN: ["Eve"]}}}}`;

        await wsClient.subscribe(personSubscriptionQuery({ typePerson, where }));

        await supertest(server.path)
            .post("")
            .send({
                query: `
                    mutation {
                        ${typePerson.operations.create}(
                            input: [
                                {
                                    knownBy: {
                                        create: [
                                            {
                                                node: {
                                                    name: "Eve"
                                                },
                                                edge: {
                                                    year: 2020,
                                                }
                                            },
                                            {
                                                node: {
                                                    name: "Mark"
                                                },
                                                edge: {
                                                    year: 2010,
                                                }
                                            }
                                        ]
                                    },
                                    name: "Adam",
                                }
                            ]
                        ) {
                            ${typePerson.plural} {
                                name
                            }
                        }
                    }
                `,
            })
            .expect(200);

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toHaveLength(1);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typePerson.operations.subscribe.relationship_created]: {
                    [typePerson.operations.subscribe.payload.relationship_created]: { name: "Adam" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "knownBy",
                    createdRelationship: {
                        knownBy: {
                            year: 2020,
                            node: {
                                name: "Eve",
                            },
                        },
                    },
                },
            },
        ]);
    });
    test("node relationship to self - standard type - inverse - IN", async () => {
        const where = `{createdRelationship: {knownBy: {node: {name_IN: ["Adam"]}}}}`;

        await wsClient.subscribe(personSubscriptionQuery({ typePerson, where }));

        await supertest(server.path)
            .post("")
            .send({
                query: `
                    mutation {
                        ${typePerson.operations.create}(
                            input: [
                                {
                                    knownBy: {
                                        create: [
                                            {
                                                node: {
                                                    name: "Eve"
                                                },
                                                edge: {
                                                    year: 2020,
                                                }
                                            },
                                            {
                                                node: {
                                                    name: "Mark"
                                                },
                                                edge: {
                                                    year: 2010,
                                                }
                                            }
                                        ]
                                    },
                                    name: "Adam",
                                }
                            ]
                        ) {
                            ${typePerson.plural} {
                                name
                            }
                        }
                    }
                `,
            })
            .expect(200);

        // forcing a delay to ensure events do not exist
        await delay(4);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toHaveLength(0);
    });

    test("node relationship to self - standard type - by connected field - IN", async () => {
        const where = `{${typePerson.operations.subscribe.payload.relationship_created}: {name_IN: ["Adam"]}}`;

        await wsClient.subscribe(personSubscriptionQuery({ typePerson, where }));

        await supertest(server.path)
            .post("")
            .send({
                query: `
                    mutation {
                        ${typePerson.operations.create}(
                            input: [
                                {
                                    knownBy: {
                                        create: [
                                            {
                                                node: {
                                                    name: "Eve"
                                                },
                                                edge: {
                                                    year: 2020,
                                                }
                                            },
                                            {
                                                node: {
                                                    name: "Mark"
                                                },
                                                edge: {
                                                    year: 2010,
                                                }
                                            }
                                        ]
                                    },
                                    name: "Adam",
                                }
                            ]
                        ) {
                            ${typePerson.plural} {
                                name
                            }
                        }
                    }
                `,
            })
            .expect(200);

        await wsClient.waitForEvents(2);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toHaveLength(2);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typePerson.operations.subscribe.relationship_created]: {
                    [typePerson.operations.subscribe.payload.relationship_created]: { name: "Adam" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "knownBy",
                    createdRelationship: {
                        knownBy: {
                            year: 2020,
                            node: {
                                name: "Eve",
                            },
                        },
                    },
                },
            },
            {
                [typePerson.operations.subscribe.relationship_created]: {
                    [typePerson.operations.subscribe.payload.relationship_created]: { name: "Adam" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "knownBy",
                    createdRelationship: {
                        knownBy: {
                            year: 2010,
                            node: {
                                name: "Mark",
                            },
                        },
                    },
                },
            },
        ]);
    });

    test("node relationship to self - standard type - by connected field expecting none - IN", async () => {
        const where = `{${typePerson.operations.subscribe.payload.relationship_created}: {name_IN: ["Eve"]}}`;

        await wsClient.subscribe(personSubscriptionQuery({ typePerson, where }));

        await supertest(server.path)
            .post("")
            .send({
                query: `
                    mutation {
                        ${typePerson.operations.create}(
                            input: [
                                {
                                    knownBy: {
                                        create: [
                                            {
                                                node: {
                                                    name: "Eve"
                                                },
                                                edge: {
                                                    year: 2020,
                                                }
                                            },
                                            {
                                                node: {
                                                    name: "Mark"
                                                },
                                                edge: {
                                                    year: 2010,
                                                }
                                            }
                                        ]
                                    },
                                    name: "Adam",
                                }
                            ]
                        ) {
                            ${typePerson.plural} {
                                name
                            }
                        }
                    }
                `,
            })
            .expect(200);

        // forcing a delay to ensure events do not exist
        await delay(4);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toHaveLength(0);
    });
});
