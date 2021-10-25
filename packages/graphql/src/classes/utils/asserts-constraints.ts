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

import { Driver } from "neo4j-driver";
import Node from "../Node";
import { DriverConfig } from "../..";

export interface AssertConstraintOptions {
    create?: boolean;
}

// Format of modern return from "SHOW CONSTRAINTS"
interface Constraint {
    id: number;
    name: string;
    type: string;
    entityType?: string;
    labelsOrTypes: string[];
    properties: string[];
    ownedIndexId: number;
}

/**
 * Format of constraint returned from db.constraints procedure. For example:
 *
 *  {
 *      description: "CONSTRAINT ON ( cjzrqcaflcfrvpjdmctjjvtbkmaqtvdkbook:cJzrQcaFLCFRvPJDmCTJjvtBkmaQtvdkBook ) ASSERT (cjzrqcaflcfrvpjdmctjjvtbkmaqtvdkbook.isbn) IS UNIQUE",
 *      details: "Constraint( id=4, name='cJzrQcaFLCFRvPJDmCTJjvtBkmaQtvdkBook_isbn', type='UNIQUENESS', schema=(:cJzrQcaFLCFRvPJDmCTJjvtBkmaQtvdkBook {isbn}), ownedIndex=3 )",
 *      name: "cJzrQcaFLCFRvPJDmCTJjvtBkmaQtvdkBook_isbn"
 *  }
 */
export interface LegacyConstraint {
    description?: string;
    details?: string;
    name?: string;
}

export function parseLegacyConstraint(record: LegacyConstraint): Constraint {
    if (!record.details || !record.details.startsWith("Constraint( ")) {
        throw new Error("Unable to parse constraint details");
    }

    const constraintDetails = record.details.substr(12).slice(0, -2);
    const detailsKeys = constraintDetails.split(", ");

    const constraint = detailsKeys.reduce((c, kv) => {
        const [k, v] = kv.split("=");

        switch (k) {
            case "id":
                return { ...c, [k]: parseInt(v, 10) };
            case "name":
            case "type": {
                // Trim leading and trailing apostrophe
                const value = v.substr(1).slice(0, -1);

                // If a uniqueness constraint, it's definitely for node property
                if (value === "UNIQUENESS") {
                    return { ...c, [k]: value, entityType: "NODE" };
                }
                return { ...c, [k]: value };
            }
            case "schema": {
                // Parse the format of schema string, example given above
                const match = /^\(:(?<label>.+) {(?<property>.+)}\)$/gm.exec(v);

                const label = match?.groups?.label;
                const property = match?.groups?.property;

                return { ...c, labelsOrTypes: [label], properties: [property] };
            }
            case "ownedIndex":
                return { ...c, ownedIndexId: parseInt(v, 10) };
            default:
                throw new Error(`Unknown key within constraint details: ${k}`);
        }
    }, {});

    return constraint as Constraint;
}

async function assertConstraints({
    driver,
    driverConfig,
    nodes,
    options,
}: {
    driver: Driver;
    driverConfig?: DriverConfig;
    nodes: Node[];
    options?: AssertConstraintOptions;
}) {
    await driver.verifyConnectivity();

    const sessionParams: {
        bookmarks?: string | string[];
        database?: string;
    } = {};

    if (driverConfig) {
        if (driverConfig.database) {
            sessionParams.database = driverConfig.database;
        }

        if (driverConfig.bookmarks) {
            sessionParams.bookmarks = driverConfig.bookmarks;
        }
    }

    const session = driver.session(sessionParams);

    if (options?.create) {
        const constraintsToCreate: { constraintName: string; label: string; property: string }[] = [];

        nodes.forEach((node) => {
            node.constrainableFields.forEach((field) => {
                if (field.unique) {
                    constraintsToCreate.push({
                        constraintName: field.unique.constraintName,
                        label: node.getMainLabel(),
                        property: field.dbPropertyName || field.fieldName,
                    });
                }
            });
        });

        for (const constraintToCreate of constraintsToCreate) {
            const cypher = `CREATE CONSTRAINT ${constraintToCreate.constraintName} IF NOT EXISTS ON (n:${constraintToCreate.label}) ASSERT n.${constraintToCreate.property} IS UNIQUE`;
            // eslint-disable-next-line no-await-in-loop
            await session.run(cypher);
        }
    } else {
        const cypher = "CALL db.constraints";
        // TODO: Swap line below with above when 4.1 no longer supported
        // const cypher = "SHOW UNIQUE CONSTRAINTS";

        const existingConstraints: Record<string, string[]> = {};
        const missingConstraints: string[] = [];

        try {
            const result = await session.run(cypher);

            result.records
                .map((record) => record.toObject())
                .forEach((record) => {
                    const constraint = parseLegacyConstraint(record);

                    const label = constraint.labelsOrTypes[0];
                    const property = constraint.properties[0];

                    // TODO: Swap lines below with above to switch to "SHOW CONSTRAINTS"
                    // const label = record.labelsOrTypes[0];
                    // const property = record.properties[0];

                    if (existingConstraints[label]) {
                        existingConstraints[label].push(property);
                    } else {
                        existingConstraints[label] = [property];
                    }
                });
        } finally {
            await session.close();
        }

        nodes.forEach((node) => {
            node.constrainableFields.forEach((field) => {
                if (field.unique) {
                    const property = field.dbPropertyName || field.fieldName;
                    if (!existingConstraints[node.getMainLabel()]?.includes(property)) {
                        missingConstraints.push(`Missing constraint for ${node.name}.${property}`);
                    }
                }
            });
        });

        if (missingConstraints.length) {
            throw new Error(missingConstraints.join("\n"));
        }
    }
}

export default assertConstraints;
