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

import { gql } from "apollo-server";
import { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../../../src";
import { createJwtRequest } from "../../../utils/create-jwt-request";
import { formatCypher, translateQuery, formatParams } from "../../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/1131", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type BibliographicReference @node(additionalLabels: ["Resource"]) {
                iri: ID! @unique @alias(property: "uri")
                prefLabel: [String]
                isInPublication: [Concept!]! @relationship(type: "isInPublication", direction: OUT)
            }

            type Concept @node(additionalLabels: ["Resource"]) {
                iri: ID! @unique @alias(property: "uri")
                prefLabel: [String]!
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true },
        });
    });

    test("where with multiple filters and params", async () => {
        const query = gql`
            mutation {
                updateBibliographicReferences(
                    where: { iri: "urn:myiri2" }
                    update: {
                        prefLabel: "Updated Label:My BRS with Resource"
                        isInPublication: [
                            {
                                connectOrCreate: {
                                    where: { node: { iri: "new-g" } }
                                    onCreate: { node: { iri: "new-g", prefLabel: "pub" } }
                                }
                            }
                            {
                                connectOrCreate: {
                                    where: { node: { iri: "new-f" } }
                                    onCreate: { node: { iri: "new-f", prefLabel: "pub" } }
                                }
                            }
                        ]
                    }
                ) {
                    bibliographicReferences {
                        iri
                        prefLabel
                        isInPublication(where: { iri_IN: ["new-f", "new-e"] }) {
                            iri
                            prefLabel
                        }
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`BibliographicReference\`:\`Resource\`)
            WHERE this.uri = $this_iri
            SET this.prefLabel = $this_update_prefLabel
            	WITH this
            CALL {
            	WITH this
            	MERGE (this_isInPublication0_connectOrCreate_this1:\`Concept\`:\`Resource\` { uri: $this_isInPublication0_connectOrCreate_param0 })
            ON CREATE SET
                    this_isInPublication0_connectOrCreate_this1.uri = $this_isInPublication0_connectOrCreate_param1,
            this_isInPublication0_connectOrCreate_this1.prefLabel = $this_isInPublication0_connectOrCreate_param2
            MERGE (this)-[this_isInPublication0_connectOrCreate_this0:\`isInPublication\`]->(this_isInPublication0_connectOrCreate_this1)
            	RETURN COUNT(*)
            }
            	WITH this
            CALL {
            	WITH this
            	MERGE (this_isInPublication1_connectOrCreate_this1:\`Concept\`:\`Resource\` { uri: $this_isInPublication1_connectOrCreate_param0 })
            ON CREATE SET
                    this_isInPublication1_connectOrCreate_this1.uri = $this_isInPublication1_connectOrCreate_param1,
            this_isInPublication1_connectOrCreate_this1.prefLabel = $this_isInPublication1_connectOrCreate_param2
            MERGE (this)-[this_isInPublication1_connectOrCreate_this0:\`isInPublication\`]->(this_isInPublication1_connectOrCreate_this1)
            	RETURN COUNT(*)
            }
            RETURN collect(DISTINCT this { iri: this.uri, .prefLabel, isInPublication: [ (this)-[:isInPublication]->(this_isInPublication:\`Concept\`:\`Resource\`)  WHERE this_isInPublication.uri IN $this_isInPublication_iri_IN | this_isInPublication { iri: this_isInPublication.uri, .prefLabel } ] }) AS data"
        `);
        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_iri\\": \\"urn:myiri2\\",
                \\"this_update_prefLabel\\": [
                    \\"Updated Label:My BRS with Resource\\"
                ],
                \\"this_isInPublication0_connectOrCreate_param0\\": \\"new-g\\",
                \\"this_isInPublication0_connectOrCreate_param1\\": \\"new-g\\",
                \\"this_isInPublication0_connectOrCreate_param2\\": [
                    \\"pub\\"
                ],
                \\"this_isInPublication1_connectOrCreate_param0\\": \\"new-f\\",
                \\"this_isInPublication1_connectOrCreate_param1\\": \\"new-f\\",
                \\"this_isInPublication1_connectOrCreate_param2\\": [
                    \\"pub\\"
                ],
                \\"this_isInPublication_iri_IN\\": [
                    \\"new-f\\",
                    \\"new-e\\"
                ],
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });
});
