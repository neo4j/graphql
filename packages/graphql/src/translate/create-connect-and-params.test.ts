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
import { Neo4jGraphQL } from "../classes";
import { Context } from "../types";
import { trimmer } from "../utils";
import { NodeBuilder } from "../../tests/utils/builders/node-builder";

describe("createConnectAndParams", () => {
    test("should return the correct connection", () => {
        // @ts-ignore
        const node = new NodeBuilder({
            name: "Movie",
            enumFields: [],
            scalarFields: [],
            primitiveFields: [],
            relationFields: [
                {
                    direction: "OUT",
                    type: "SIMILAR",
                    types: ["SIMILAR"],
                    paramName: "similar",
                    multiple: false,
                    fieldName: "similarMovies",
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

        // @ts-ignore
        const neoSchema: Neo4jGraphQL = {
            nodes: [node],
        };

        // @ts-ignore
        const context: Context = { neoSchema };

        const result = createConnectAndParams({
            withVars: ["this"],
            value: [
                {
                    where: { node: { title: "abc" } },
                    connect: { similarMovies: [{ where: { node: { title: "cba" } } }] },
                },
            ],
            varName: "this",
            relationField: node.relationFields[0],
            parentVar: "this",
            context,
            refNodes: [node],
            parentNode: node,
        });

        expect(trimmer(result[0])).toEqual(
            trimmer(`
                WITH this
                CALL {
                    WITH this
                    OPTIONAL MATCH (this0_node:Movie)
                    WHERE this0_node.title = $this0_node_title
                    FOREACH(_ IN CASE this WHEN NULL THEN [] ELSE [1] END |
                        FOREACH(_ IN CASE this0_node WHEN NULL THEN [] ELSE [1] END |
                            MERGE (this)-[:SIMILAR]->(this0_node)
                        )
                    )

                    WITH this, this0_node
                    CALL {
                        WITH this, this0_node
                        OPTIONAL MATCH (this0_node_similarMovies0_node:Movie)
                        WHERE this0_node_similarMovies0_node.title = $this0_node_similarMovies0_node_title
                        FOREACH(_ IN CASE this0_node WHEN NULL THEN [] ELSE [1] END |
                            FOREACH(_ IN CASE this0_node_similarMovies0_node WHEN NULL THEN [] ELSE [1] END |
                                MERGE (this0_node)-[:SIMILAR]->(this0_node_similarMovies0_node)
                            )
                        )
                        RETURN count(*)
                    }

                    RETURN count(*)
                }
            `)
        );

        expect(result[1]).toMatchObject({
            this0_node_title: "abc",
            this0_node_similarMovies0_node_title: "cba",
        });
    });
});
