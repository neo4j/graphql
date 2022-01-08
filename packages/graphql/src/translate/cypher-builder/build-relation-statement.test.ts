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

import { Context } from "../../types";
import { NodeBuilder } from "../../../tests/utils/builders/node-builder";
import { RelationFieldBuilder } from "../../../tests/utils/builders/relation-field-builder";
import { ContextBuilder } from "../../../tests/utils/builders/context-builder";
import { Node } from "../../classes";
import { buildRelationStatement } from "./build-relation-statement";

describe("build relation statement", () => {
    let context: Context;
    let nodeA: Node;
    let nodeB: Node;

    beforeAll(() => {
        context = new ContextBuilder().instance();
        nodeA = new NodeBuilder({
            name: "MyLabel",
        }).instance();
        nodeB = new NodeBuilder({
            name: "AnotherNode",
        }).instance();
    });
    test("simple relation", () => {
        const relationField = new RelationFieldBuilder().instance();
        const statement = buildRelationStatement({
            leftNode: {
                node: nodeA,
                varName: "this",
            },
            rightNode: {
                node: nodeB,
                varName: "that",
            },
            relation: {
                relationField,
                varName: "relationName",
            },
            context,
        });

        expect(statement[0]).toEqual("(this:MyLabel)-[relationName]->(that:AnotherNode)");
        expect(statement[1]).toEqual({});
    });

    test("with different direction and label", () => {
        const relationField = new RelationFieldBuilder({ direction: "IN", type: "MyRelation" }).instance();
        const statement = buildRelationStatement({
            leftNode: {
                node: nodeA,
                varName: "this",
            },
            rightNode: {
                node: nodeB,
                varName: "that",
            },
            relation: {
                relationField,
                varName: "relationName",
            },
            context,
        });

        expect(statement[0]).toEqual("(this:MyLabel)<-[relationName:MyRelation]-(that:AnotherNode)");
        expect(statement[1]).toEqual({});
    });

    test("with node parameters", () => {
        const relationField = new RelationFieldBuilder({ direction: "IN", type: "MyRelation" }).instance();
        const statement = buildRelationStatement({
            leftNode: {
                node: nodeA,
                varName: "this",
                parameters: {
                    name: "Arthur",
                },
            },
            rightNode: {
                node: nodeB,
                varName: "that",
                parameters: {
                    name: "Zaphod",
                },
            },
            relation: {
                relationField,
                varName: "relationName",
            },
            context,
        });

        expect(statement[0]).toEqual(
            "(this:MyLabel { name: $this_node_name })<-[relationName:MyRelation]-(that:AnotherNode { name: $that_node_name })"
        );
        expect(statement[1]).toEqual({
            this_node_name: "Arthur",
            that_node_name: "Zaphod",
        });
    });

    test("with relation parameters", () => {
        const relationField = new RelationFieldBuilder({ direction: "IN", type: "MyRelation" }).instance();
        const statement = buildRelationStatement({
            leftNode: {
                node: nodeA,
                varName: "this",
            },
            rightNode: {
                node: nodeB,
                varName: "that",
            },
            relation: {
                relationField,
                varName: "relationName",
                parameters: {
                    status: "frenemies",
                },
            },
            context,
        });

        expect(statement[0]).toEqual(
            "(this:MyLabel)<-[relationName:MyRelation { status: $relationName_relation_status }]-(that:AnotherNode)"
        );
        expect(statement[1]).toEqual({
            relationName_relation_status: "frenemies",
        });
    });
});
