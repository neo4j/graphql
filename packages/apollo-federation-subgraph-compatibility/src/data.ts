/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { Driver } from "neo4j-driver";

export async function createData(driver: Driver): Promise<void> {
    const session = driver.session();

    await session.executeWrite((tx) =>
        tx.run(`
            CREATE (dimension:ProductDimension { size: "small", weight: 1.0, unit: "kg" })

            CREATE (user:User { email: "support@apollographql.com", name: "Jane Smith", totalProductsCreated: 1337, yearsOfEmployment: 10 })

            CREATE (deprecatedProduct:DeprecatedProduct { sku: "apollo-federation-v1", package: "@apollo/federation-v1", reason: "Migrate to Federation V2" })-[:CREATED_BY]->(user)

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

            CREATE (inventory:Inventory { id: "apollo-oss" })-[:HAS_DEPRECATED_PRODUCT]->(deprecatedProduct)
        `)
    );

    await session.close();
}
