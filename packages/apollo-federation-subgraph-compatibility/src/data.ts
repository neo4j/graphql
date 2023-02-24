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

import type { Driver } from "neo4j-driver";

export async function createData(driver: Driver): Promise<void> {
    const session = driver.session();

    await session.executeWrite((tx) =>
        tx.run(`
            CREATE (dimension:ProductDimension { size: "small", weight: 1.0, unit: "kg" })

            CREATE (user:User { email: "support@apollographql.com", name: "Jane Smith", totalProductsCreated: 1337, yearsOfEmployment: 10 })

            CREATE (:DeprecatedProduct { sku: "apollo-federation-v1", package: "@apollo/federation-v1", reason: "Migrate to Federation V2" })-[:CREATED_BY]->(user)

            CREATE (p1:Product { id: "apollo-federation", sku: "federation", package: "@apollo/federation" })
            CREATE (p1)-[:HAS_VARIATION]->(:ProductVariation { id: "OSS" })
            CREATE (p1)-[:HAS_DIMENSIONS]->(dimension)
            CREATE (p1)-[:HAS_RESEARCH]->(:ProductResearch)-[:HAS_STUDY]->(:CaseStudy { caseNumber: "1234", description: "Federation Study" })
            CREATE (p1)-[:CREATED_BY]->(user)

            CREATE (p2:Product { id: "apollo-studio", sku: "studio", package: "" })
            CREATE (p2)-[:HAS_VARIATION]->(:ProductVariation { id: "platform" })
            CREATE (p2)-[:HAS_DIMENSIONS]->(dimension)
            CREATE (p2)-[:HAS_RESEARCH]->(:ProductResearch)-[:HAS_STUDY]->(:CaseStudy { caseNumber: "1235", description: "Studio Study" })
            CREATE (p2)-[:CREATED_BY]->(user)
        `)
    );

    await session.close();
}
