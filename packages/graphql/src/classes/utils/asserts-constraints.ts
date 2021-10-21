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
                        label: node.name,
                        property: field.fieldName,
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
        const cypher = "SHOW UNIQUE CONSTRAINTS";

        const existingConstraints: Record<string, string[]> = {};
        const missingConstraints: string[] = [];

        try {
            const result = await session.run(cypher);

            result.records
                .map((record) => record.toObject())
                .forEach((record) => {
                    const label = record.labelsOrTypes[0];
                    const property = record.properties[0];

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
                    if (!existingConstraints[node.name]?.includes(field.fieldName)) {
                        missingConstraints.push(`Missing constraint for ${node.name}.${field.fieldName}`);
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
