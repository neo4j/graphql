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

import { Neo4jGraphQL } from "../classes";
import WithProjector from "../classes/WithProjector";
import { Context } from "../types";
import { trimmer } from "../utils";
import { NodeBuilder } from "../utils/test/builders/node-builder";
import createDisconnectAndParams from "./create-disconnect-and-params";

describe("createDisconnectAndParams", () => {
    test("should return the correct disconnect", () => {
        const node = new NodeBuilder({
            name: "Movie",
            relationFields: [
                {
                    direction: "OUT",
                    type: "SIMILAR",
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
            withProjector: new WithProjector({ variables: [ 'this' ] }),
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
                WITH this, this0, this0_rel, [ metaVal IN [{type: 'Disconnected', name: 'Movie', toName: 'Movie', relationshipName: 'SIMILAR', id: id(this), toID: id(this0), relationshipID: id(this0_rel)}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL ] as this_mutateMeta
                FOREACH(_ IN CASE this0 WHEN NULL THEN [] ELSE [1] END | DELETE this0_rel )
                WITH this, this0, this0_rel, this_mutateMeta
                CALL {
                    WITH this, this0, this0_rel
                    OPTIONAL MATCH (this0)-[this0_similarMovies0_rel:SIMILAR]->(this0_similarMovies0:Movie)
                    WHERE this0_similarMovies0.title = $this[0].disconnect.similarMovies[0].where.node.title
                    WITH this, this0, this0_rel, this0_similarMovies0, this0_similarMovies0_rel, [ metaVal IN [{type: 'Disconnected', name: 'Movie', toName: 'Movie', relationshipName: 'SIMILAR', id: id(this0), toID: id(this0_similarMovies0), relationshipID: id(this0_similarMovies0_rel)}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL ] as this0_mutateMeta
                    FOREACH(_ IN CASE this0_similarMovies0 WHEN NULL THEN [] ELSE [1] END | DELETE this0_similarMovies0_rel )
                    RETURN REDUCE(tmp1_this0_mutateMeta = [], tmp2_this0_mutateMeta IN COLLECT(this0_mutateMeta) | tmp1_this0_mutateMeta + tmp2_this0_mutateMeta) as this0_mutateMeta
                }
                WITH this, this0, this0_rel, this_mutateMeta + this0_mutateMeta as this_mutateMeta
                RETURN REDUCE(tmp1_this_mutateMeta = [], tmp2_this_mutateMeta IN COLLECT(this_mutateMeta) | tmp1_this_mutateMeta + tmp2_this_mutateMeta) as this_mutateMeta
            }
            WITH this, this_mutateMeta as mutateMeta
            `)
        );

        expect(result[1]).toMatchObject({});
    });
});
