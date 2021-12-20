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

import createDisconnectAndParams from "./create-disconnect-and-params";
import { Neo4jGraphQL } from "../classes";
import { Context } from "../types";
import { trimmer } from "../utils";
import { NodeBuilder } from "../../tests/utils/builders/node-builder";

describe("createDisconnectAndParams", () => {
    test("should return the correct disconnect", () => {
        const node = new NodeBuilder({
            name: "Movie",
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
            enumFields: [],
            scalarFields: [],
            primitiveFields: [],
            temporalFields: [],
            interfaceFields: [],
            unionFields: [],
            objectFields: [],
            pointFields: [],
            otherDirectives: [],
            interfaces: [],
        }).instance();

        // @ts-ignore
        const neoSchema: Neo4jGraphQL = {
            nodes: [node],
            relationships: [],
        };

        // @ts-ignore
        const context: Context = { neoSchema };

        const result = createDisconnectAndParams({
            withVars: ["this"],
            value: [
                {
                    where: { node: { title: "abc" } },
                    disconnect: { similarMovies: [{ where: { node: { title: "cba" } } }] },
                },
            ],
            varName: "this",
            relationField: node.relationFields[0],
            parentVar: "this",
            context,
            refNodes: [node],
            parentNode: node,
            parameterPrefix: "this", // TODO
        });

        expect(trimmer(result[0])).toEqual(
            trimmer(`
            WITH this
            CALL {
                WITH this
                OPTIONAL MATCH (this)-[this0_rel:SIMILAR]->(this0:Movie)
                WHERE this0.title = $this[0].where.node.title
                FOREACH(_ IN CASE this0 WHEN NULL THEN [] ELSE [1] END | DELETE this0_rel )

                WITH this, this0
                CALL {
                    WITH this, this0
                    OPTIONAL MATCH (this0)-[this0_similarMovies0_rel:SIMILAR]->(this0_similarMovies0:Movie)
                    WHERE this0_similarMovies0.title = $this[0].disconnect.similarMovies[0].where.node.title
                    FOREACH(_ IN CASE this0_similarMovies0 WHEN NULL THEN [] ELSE [1] END | DELETE this0_similarMovies0_rel )
                    RETURN count(*)
                }

                RETURN count(*)
            }
            `)
        );

        expect(result[1]).toMatchObject({});
    });
});
