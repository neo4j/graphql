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

import { Neo4jGraphQL } from "../../../src";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("Missing custom Cypher on unions", () => {
    let neoSchema: Neo4jGraphQL;

    const typeDefs = /* GraphQL */ `
        type Fragment
            @node(labels: ["Fragment", "$context.tenant", "Resource"])
            @mutation(operations: [])
            @limit(default: 100, max: 1000) {
            iri: ID! @id @alias(property: "uri")
        }

        union hierarchicalNodeTarget = HierarchicalRoot | HierarchicalComponent | Expression | Work | Fragment

        type HierarchicalRoot
            @node(labels: ["HierarchicalRoot", "Resource"])
            @mutation(operations: [])
            @limit(default: 100, max: 300) {
            iri: ID! @id @alias(property: "uri")
        }

        type Expression
            @node(labels: ["Expression", "$context.tenant", "Resource"])
            @mutation(operations: [])
            @limit(default: 100, max: 300) {
            iri: ID! @id @alias(property: "uri")
        }

        type Work
            @node(labels: ["Work", "$context.tenant", "Resource"])
            @mutation(operations: [])
            @limit(default: 100, max: 300) {
            iri: ID! @id @alias(property: "uri")
        }

        type HierarchicalComponent
            @node(labels: ["HierarchicalComponent", "Resource"])
            @mutation(operations: [])
            @limit(default: 100, max: 300) {
            iri: ID! @id @alias(property: "uri")
            relatesToChild: [hierarchicalNodeTarget!]!
                @relationship(type: "relatesToChild", properties: "RelateProps", direction: OUT)
            isContained: HierarchicalRoot! @relationship(type: "isContained", properties: "RelateProps", direction: OUT)

            hierarchicalPathNodes: [choNode]
                @cypher(
                    statement: """
                    MATCH p=(this)<-[:relatesToChild*..10]-(parent:HierarchicalRoot)
                    WITH p, parent
                    OPTIONAL MATCH (parent) - [:type] -> (parentType)
                    WITH p, parent, parentType
                    UNWIND nodes(p) as pathNode
                    WITH pathNode, relationships(p) as rels, parent, parentType
                    WITH pathNode, head([r in rels where endNode(r) = pathNode]) as relation, parent, parentType
                    OPTIONAL MATCH (pathNode) - [:identifier] -> (pathNodeIdentifier)
                    OPTIONAL MATCH (pathNode) - [:title] -> (pathNodeTitle)
                    WITH pathNode, relation, parent, parentType, pathNodeIdentifier, collect({value: pathNodeTitle.value, language: pathNodeTitle.language}) as pathNodeTitles
                    WITH {
                    uri: pathNode.uri,
                    identifier: pathNodeIdentifier.value,
                    title: pathNodeTitles,
                    hasSortKey: relation.hasSortKey,
                    labels: labels(pathNode),
                    partOf: parent.uri,
                    partOfType: parentType.uri
                    } AS obj
                    RETURN DISTINCT obj as result
                    """
                    columnName: "result"
                )
        }
        type choNode @mutation(operations: []) {
            iri: ID! @id @alias(property: "uri")
            identifier: String
            title: [title]
            hasSortKey: String
            labels: [String]
            partOf: ID
            partOfType: String
        }

        type title @mutation(operations: []) {
            value: String
            language: String
        }

        union relatesToChildTarget = Expression | Work | Fragment | HierarchicalRoot

        type RelateProps @relationshipProperties {
            hasSortKey: String
            isIdentifiedBy: ID
        }
    `;

    beforeAll(() => {
        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("should include checks for auth jwt param is not null", async () => {
        const query = /* GraphQL */ `
            query browseHierarchicalComponents($hierarchicalRootId: ID!, $choNodeIris: [ID!]!) {
                hierarchicalComponents(where: { isContained: { iri: $hierarchicalRootId }, iri_IN: $choNodeIris }) {
                    #...hierarchicalComponentFields
                    relatesToChild {
                        ...hierarchicalComponentFields
                    }
                }
            }

            fragment hierarchicalComponentFields on HierarchicalComponent {
                hierarchicalPathNodes {
                    iri
                    hasSortKey
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, {
            variableValues: {
                hierarchicalRootId: "aaa:bbb::cc::dd/111-111-111",
                choNodeIris: ["aaa:bbb::cc::dd/222-22-22"],
            },
            contextValues: {
                tenant: "MyTenant",
            },
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:HierarchicalComponent:Resource)
            OPTIONAL MATCH (this)-[:isContained]->(this0:HierarchicalRoot:Resource)
            WITH *, count(this0) AS isContainedCount
            WITH *
            WHERE (this.uri IN $param0 AND (isContainedCount <> 0 AND this0.uri = $param1))
            WITH *
            LIMIT $param2
            CALL {
                WITH this
                CALL {
                    WITH *
                    MATCH (this)-[this1:relatesToChild]->(this2:HierarchicalRoot:Resource)
                    WITH this2 { __resolveType: \\"HierarchicalRoot\\", __id: id(this2) } AS this2
                    RETURN this2 AS var3
                    UNION
                    WITH *
                    MATCH (this)-[this4:relatesToChild]->(this5:HierarchicalComponent:Resource)
                    CALL {
                        WITH this5
                        CALL {
                            WITH this5
                            WITH this5 AS this
                            MATCH p=(this)<-[:relatesToChild*..10]-(parent:HierarchicalRoot)
                            WITH p, parent
                            OPTIONAL MATCH (parent) - [:type] -> (parentType)
                            WITH p, parent, parentType
                            UNWIND nodes(p) as pathNode
                            WITH pathNode, relationships(p) as rels, parent, parentType
                            WITH pathNode, head([r in rels where endNode(r) = pathNode]) as relation, parent, parentType
                            OPTIONAL MATCH (pathNode) - [:identifier] -> (pathNodeIdentifier)
                            OPTIONAL MATCH (pathNode) - [:title] -> (pathNodeTitle)
                            WITH pathNode, relation, parent, parentType, pathNodeIdentifier, collect({value: pathNodeTitle.value, language: pathNodeTitle.language}) as pathNodeTitles
                            WITH {
                            uri: pathNode.uri,
                            identifier: pathNodeIdentifier.value,
                            title: pathNodeTitles,
                            hasSortKey: relation.hasSortKey,
                            labels: labels(pathNode),
                            partOf: parent.uri,
                            partOfType: parentType.uri
                            } AS obj
                            RETURN DISTINCT obj as result
                        }
                        WITH result AS this6
                        RETURN collect(this6 { .hasSortKey, iri: this6.uri }) AS this6
                    }
                    WITH this5 { hierarchicalPathNodes: this6, __resolveType: \\"HierarchicalComponent\\", __id: id(this5) } AS this5
                    RETURN this5 AS var3
                    UNION
                    WITH *
                    MATCH (this)-[this7:relatesToChild]->(this8:Expression:MyTenant:Resource)
                    WITH this8 { __resolveType: \\"Expression\\", __id: id(this8) } AS this8
                    RETURN this8 AS var3
                    UNION
                    WITH *
                    MATCH (this)-[this9:relatesToChild]->(this10:Work:MyTenant:Resource)
                    WITH this10 { __resolveType: \\"Work\\", __id: id(this10) } AS this10
                    RETURN this10 AS var3
                    UNION
                    WITH *
                    MATCH (this)-[this11:relatesToChild]->(this12:Fragment:MyTenant:Resource)
                    WITH this12 { __resolveType: \\"Fragment\\", __id: id(this12) } AS this12
                    RETURN this12 AS var3
                }
                WITH var3
                RETURN collect(var3) AS var3
            }
            RETURN this { relatesToChild: var3 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": [
                    \\"aaa:bbb::cc::dd/222-22-22\\"
                ],
                \\"param1\\": \\"aaa:bbb::cc::dd/111-111-111\\",
                \\"param2\\": {
                    \\"low\\": 100,
                    \\"high\\": 0
                }
            }"
        `);
    });
});
