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

import createConnectAndParams from "./create-connect-and-params";
import { CallbackBucket } from "../classes/CallbackBucket";
import { NodeBuilder } from "../../tests/utils/builders/node-builder";
import { RelationshipQueryDirectionOption } from "../constants";
import { ContextBuilder } from "../../tests/utils/builders/context-builder";
import { Neo4jDatabaseInfo } from "../classes/Neo4jDatabaseInfo";
import { RelationField } from "../types";

describe("createConnectAndParams", () => {
    test("should return the correct connection", () => {
        const node = new NodeBuilder({
            name: "Movie",
            enumFields: [],
            scalarFields: [],
            primitiveFields: [],
            relationFields: [
                {
                    direction: "OUT",
                    type: "SIMILAR",
                    fieldName: "similarMovies",
                    queryDirection: RelationshipQueryDirectionOption.DEFAULT_DIRECTED,
                    inherited: false,
                    typeMeta: {
                        name: "Movie",
                        array: true,
                        required: false,
                        pretty: "[Movies]",
                        input: {
                            where: {
                                type: "Movie",
                                pretty: "[Movie]",
                            },
                            create: {
                                type: "Movie",
                                pretty: "[Movie]",
                            },
                            update: {
                                type: "Movie",
                                pretty: "[Movie]",
                            },
                        },
                    },
                    otherDirectives: [],
                    arguments: [],
                },
            ],
            cypherFields: [],
            temporalFields: [],
            interfaceFields: [],
            pointFields: [],
            objectFields: [],
        }).instance();

        const context = new ContextBuilder({
            nodes: [node],
            neo4jDatabaseInfo: new Neo4jDatabaseInfo("4.4.0"),
        }).instance();

        const result = createConnectAndParams({
            withVars: ["this"],
            value: [
                {
                    where: { node: { title: "abc" } },
                    connect: { similarMovies: [{ where: { node: { title: "cba" } } }] },
                },
            ],
            varName: "this",
            relationField: node.relationFields[0] as RelationField,
            parentVar: "this",
            context,
            refNodes: [node],
            parentNode: node,
            callbackBucket: new CallbackBucket(context),
        });

        expect(result[0]).toMatchInlineSnapshot(`
            "WITH this
            CALL {
            	WITH this
            	OPTIONAL MATCH (this0_node:Movie)
            	WHERE this0_node.title = $this0_node_param0
            	CALL {
            		WITH *
            		WITH collect(this0_node) as connectedNodes, collect(this) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this
            			UNWIND connectedNodes as this0_node
            			MERGE (this)-[:SIMILAR]->(this0_node)
            			RETURN count(*) AS _
            		}
            		RETURN count(*) AS _
            	}
            WITH this, this0_node
            CALL {
            	WITH this, this0_node
            	OPTIONAL MATCH (this0_node_similarMovies0_node:Movie)
            	WHERE this0_node_similarMovies0_node.title = $this0_node_similarMovies0_node_param0
            	CALL {
            		WITH *
            		WITH this, collect(this0_node_similarMovies0_node) as connectedNodes, collect(this0_node) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this0_node
            			UNWIND connectedNodes as this0_node_similarMovies0_node
            			MERGE (this0_node)-[:SIMILAR]->(this0_node_similarMovies0_node)
            			RETURN count(*) AS _
            		}
            		RETURN count(*) AS _
            	}
            WITH this, this0_node, this0_node_similarMovies0_node
            	RETURN count(*) AS connect_this0_node_similarMovies_Movie
            }
            	RETURN count(*) AS connect_this_Movie
            }"
        `);

        expect(result[1]).toMatchObject({
            this0_node_param0: "abc",
            this0_node_similarMovies0_node_param0: "cba",
        });
    });
});
