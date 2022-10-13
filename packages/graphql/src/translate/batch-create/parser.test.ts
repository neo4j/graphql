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
import { ContextBuilder } from "../../../tests/utils/builders/context-builder";
import { NodeBuilder } from "../../../tests/utils/builders/node-builder";
import { RelationshipQueryDirectionOption } from "../../constants";
import { parseCreate } from "./parser";
import * as CypherBuilder from "../cypher-builder/CypherBuilder";
import type { TreeDescriptor } from "./types";
import { UnwindCreateVisitor } from "./unwind-create-visitors/UnwidCreateVisitor";

describe("UNWIND-CREATE parser", () => {

    test.only("something 2", () => {
        const movieNode = new NodeBuilder({
            name: "Movie",
            enumFields: [],
            scalarFields: [],
            primitiveFields: [],
            relationFields: [
                {
                    direction: "OUT",
                    type: "SIMILAR",
                    fieldName: "actors",
                    queryDirection: RelationshipQueryDirectionOption.DEFAULT_DIRECTED,
                    inherited: false,
                    typeMeta: {
                        name: "Actor",
                        array: true,
                        required: true,
                        pretty: "[Actors]",
                        input: {
                            where: {
                                type: "Actor",
                                pretty: "[Actor]",
                            },
                            create: {
                                type: "Actor",
                                pretty: "[Actor]",
                            },
                            update: {
                                type: "Actor",
                                pretty: "[Actor]",
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
        const actorNode = new NodeBuilder({
            name: "Actor",
            enumFields: [],
            scalarFields: [],
            primitiveFields: [],
            relationFields: [],
            cypherFields: [],
            temporalFields: [],
            interfaceFields: [],
            pointFields: [],
            objectFields: [],
        }).instance();
        const context = new ContextBuilder({ neoSchema: { nodes: [movieNode, actorNode] }}).instance();
        const input = {
            properties: new Set(["id", "name"]),
            childrens: {
                actors: {
                    properties: new Set(),
                    childrens: {
                        create:  {
                            properties: new Set(),
                            childrens: {
                                node: {
                                    properties: new Set(["id", "name", "age"]),
                                    childrens: {}
                                }
                            }
                        }
                    }
                }
            },
        } as TreeDescriptor;
    
        const AST = parseCreate(input, movieNode, context);
        const unwindVar = new CypherBuilder.Variable();
        // const unwindCypher =  new CypherBuilder.List([new CypherBuilder.Map({"title": new CypherBuilder.Literal("The Matrix")}), new CypherBuilder.Map({"title": new CypherBuilder.Literal("The Matrix")})]);
        const unwindStyle = new UnwindCreateVisitor(unwindVar, context);
        const clause = AST.accept(unwindStyle);
        console.log(clause.build().cypher);
        expect(true).toBe(true);
    });
});
