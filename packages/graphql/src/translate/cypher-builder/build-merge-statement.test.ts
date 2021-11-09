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

import { dedent } from "graphql-compose";
import { ContextBuilder } from "../../utils/test/builders/context-builder";
import { Context } from "../../types";
import { buildMergeStatement } from "./build-merge-statement";
import { NodeBuilder } from "../../utils/test/builders/node-builder";
import { Node } from "../../classes";
import { RelationFieldBuilder } from "../../utils/test/builders/relation-field-builder";

describe("build merge statement", () => {
    let context: Context;
    let node: Node;

    beforeAll(() => {
        context = new ContextBuilder().instance();
        node = new NodeBuilder({
            name: "MyLabel",
        }).instance();
    });
    describe("node merge", () => {
        it("build merge node statement", () => {
            const statement = buildMergeStatement({
                node: {
                    varName: "this",
                    node,
                },
                context,
            });

            expect(statement[0]).toEqual("MERGE (this:MyLabel)");
            expect(statement[1]).toEqual({});
        });

        it("build merge node statement with onCreate", () => {
            const statement = buildMergeStatement({
                node: {
                    varName: "this",
                    node,
                    onCreate: {
                        age: 23,
                        name: "Keanu",
                    },
                },
                context,
            });

            expect(dedent(statement[0])).toEqual(dedent`MERGE (this:MyLabel)
                ON CREATE SET
                this.age = $this_age,
                this.name = $this_name
            `);
            expect(statement[1]).toEqual({
                this_age: 23,
                this_name: "Keanu",
            });
        });
    });
    describe("relation merge", () => {
        it("build merge relation statement", () => {
            const relationField = new RelationFieldBuilder().instance();
            const statement = buildMergeStatement({
                node: {
                    varName: "this",
                },
                relation: {
                    varName: "that",
                    relationField,
                },
                context,
            });

            expect(statement[0]).toEqual("MERGE (this)-[]->(that)");
            expect(statement[1]).toEqual({});
        });

        it("build merge relation statement with onCreate", () => {
            const relationField = new RelationFieldBuilder().instance();
            const statement = buildMergeStatement({
                node: {
                    varName: "this",
                    node,
                    onCreate: {
                        age: 23,
                        name: "Keanu",
                    },
                },
                relation: {
                    varName: "that",
                    onCreate: {
                        screentime: 10,
                    },
                    relationField,
                },
                context,
            });

            expect(dedent(statement[0])).toEqual(dedent`MERGE (this:MyLabel)-[]->(that)
                ON CREATE SET
                this.age = $this_age,
                this.name = $this_name
                this_relationship_that.screentime = $this_relationship_that_screentime
            `);
            expect(statement[1]).toEqual({
                this_age: 23,
                this_name: "Keanu",
                this_relationship_that_screentime: 10,
            });
        });
    });
});
