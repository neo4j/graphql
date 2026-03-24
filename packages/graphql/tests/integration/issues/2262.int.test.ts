/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/2262", () => {
    const testHelper = new TestHelper();

    let Component: UniqueType;
    let Process: UniqueType;

    beforeEach(async () => {
        Component = testHelper.createUniqueType("Component");
        Process = testHelper.createUniqueType("Process");

        const typeDefs = `
            type ${Component} @node {
                uuid: String
                upstreamProcess: [${Process}!]! @relationship(type: "OUTPUT", direction: IN)
                downstreamProcesses: [${Process}!]! @relationship(type: "INPUT", direction: OUT)
            }

            type ${Process} @node {
                uuid: String
                componentOutputs: [${Component}!]! @relationship(type: "OUTPUT", direction: OUT)
                componentInputs: [${Component}!]! @relationship(type: "INPUT", direction: IN)
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("nested update with create while using subscriptions should generate valid Cypher", async () => {
        await testHelper.executeCypher(`CREATE(:${Component} {uuid: "c1"})<-[:OUTPUT]-(:${Process} {uuid: "p1"})`);
        const query = `
            query ComponentsProcesses {
                ${Component.plural}(where: { uuid_EQ: "c1" }) {
                    uuid
                    upstreamProcessConnection {
                        edges {
                            node {
                                uuid
                                componentInputsConnection(sort: [{ node: { uuid: DESC } }]) {
                                    edges {
                                        node {
                                            uuid
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [Component.plural]: [
                {
                    uuid: "c1",
                    upstreamProcessConnection: {
                        edges: [
                            {
                                node: {
                                    uuid: "p1",
                                    componentInputsConnection: {
                                        edges: [],
                                    },
                                },
                            },
                        ],
                    },
                },
            ],
        });
    });
});
