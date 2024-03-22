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

import Debug from "debug";
import type { Driver, Session } from "neo4j-driver";
import { DEBUG_EXECUTE } from "../../constants";
import type { Neo4jGraphQLSchemaModel } from "../../schema-model/Neo4jGraphQLSchemaModel";
import { ConcreteEntityAdapter } from "../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { Neo4jGraphQLSessionConfig } from "../Executor";

const debug = Debug(DEBUG_EXECUTE);

export interface AssertIndexesAndConstraintsOptions {
    create?: boolean;
}

export async function assertIndexesAndConstraints({
    driver,
    sessionConfig,
    schemaModel,
    options,
}: {
    driver: Driver;
    sessionConfig?: Neo4jGraphQLSessionConfig;
    schemaModel: Neo4jGraphQLSchemaModel;
    options?: AssertIndexesAndConstraintsOptions;
}): Promise<void> {
    await driver.verifyConnectivity();

    const session = driver.session(sessionConfig);

    try {
        if (options?.create) {
            await createIndexesAndConstraints({ schemaModel, session });
        } else {
            await checkIndexesAndConstraints({ schemaModel, session });
        }
    } finally {
        await session.close();
    }
}

async function getExistingIndexes({
    session,
}: {
    session: Session;
}): Promise<Record<string, { labelsOrTypes: string; properties: string[] }>> {
    const existingIndexes: Record<string, { labelsOrTypes: string; properties: string[] }> = {};

    const indexesCypher = "SHOW INDEXES";

    debug(`About to execute Cypher: ${indexesCypher}`);
    const indexesResult = await session.run(indexesCypher);

    indexesResult.records.forEach((record) => {
        const index = record.toObject();

        if (index.type !== "FULLTEXT" || index.entityType !== "NODE") {
            return;
        }

        if (existingIndexes[index.name]) {
            return;
        }

        existingIndexes[index.name] = {
            labelsOrTypes: index.labelsOrTypes,
            properties: index.properties,
        };
    });

    return existingIndexes;
}

async function createIndexesAndConstraints({
    schemaModel,
    session,
}: {
    schemaModel: Neo4jGraphQLSchemaModel;
    session: Session;
}) {
    const constraintsToCreate = await getMissingConstraints({ schemaModel, session });
    const indexesToCreate: { indexName: string; label: string; properties: string[] }[] = [];

    const existingIndexes = await getExistingIndexes({ session });
    const indexErrors: string[] = [];

    for (const entity of schemaModel.concreteEntities) {
        if (entity.annotations.fulltext) {
            entity.annotations.fulltext.indexes.forEach((index) => {
                const indexName = index.indexName || index.name; // TODO remove indexName assignment and undefined check once the name argument has been removed.
                if (indexName === undefined) {
                    throw new Error("The name of the fulltext index should be defined using the indexName argument.");
                }
                const existingIndex = existingIndexes[indexName];
                if (!existingIndex) {
                    const properties = index.fields.map((field) => {
                        const attribute = entity.findAttribute(field);
                        if (!attribute) {
                            throw new Error(`Attribute '${field}' not found in entity '${entity.name}'`);
                        }

                        return attribute.databaseName || field;
                    });

                    const entityAdapter = new ConcreteEntityAdapter(entity);

                    indexesToCreate.push({
                        indexName: indexName,
                        label: entityAdapter.getMainLabel(),
                        properties,
                    });
                } else {
                    index.fields.forEach((field) => {
                        const attribute = entity.findAttribute(field);
                        if (!attribute) {
                            throw new Error(`Attribute '${field}' not found in entity '${entity.name}'`);
                        }

                        const fieldName = attribute.databaseName || field;

                        const property = existingIndex.properties.find((p) => p === fieldName);
                        if (!property) {
                            const aliasError = attribute.databaseName ? ` aliased to field '${fieldName}'` : "";

                            indexErrors.push(
                                `@fulltext index '${indexName}' on Node '${entity.name}' already exists, but is missing field '${field}'${aliasError}`
                            );
                        }
                    });
                }
            });
        }
    }

    if (indexErrors.length) {
        throw new Error(indexErrors.join("\n"));
    }

    for (const constraintToCreate of constraintsToCreate) {
        const cypher = [
            `CREATE CONSTRAINT ${constraintToCreate.constraintName}`,
            `IF NOT EXISTS FOR (n:${constraintToCreate.label})`,
            `REQUIRE n.${constraintToCreate.property} IS UNIQUE`,
        ].join(" ");

        debug(`About to execute Cypher: ${cypher}`);

        const result = await session.run(cypher);

        const { constraintsAdded } = result.summary.counters.updates();

        debug(`Created ${constraintsAdded} new constraint${constraintsAdded ? "" : "s"}`);
    }

    for (const indexToCreate of indexesToCreate) {
        const cypher = [
            `CREATE FULLTEXT INDEX ${indexToCreate.indexName}`,
            `IF NOT EXISTS FOR (n:${indexToCreate.label})`,
            `ON EACH [${indexToCreate.properties.map((p) => `n.${p}`).join(", ")}]`,
        ].join(" ");

        debug(`About to execute Cypher: ${cypher}`);

        await session.run(cypher);

        debug(`Created @fulltext index ${indexToCreate.indexName}`);
    }
}

async function checkIndexesAndConstraints({
    schemaModel,
    session,
}: {
    schemaModel: Neo4jGraphQLSchemaModel;
    session: Session;
}) {
    const missingConstraints = await getMissingConstraints({ schemaModel, session });

    if (missingConstraints.length) {
        const missingConstraintMessages = missingConstraints.map(
            (constraint) => `Missing constraint for ${constraint.label}.${constraint.property}`
        );
        throw new Error(missingConstraintMessages.join("\n"));
    }

    debug("Successfully checked for the existence of all necessary constraints");

    const existingIndexes = await getExistingIndexes({ session });
    const indexErrors: string[] = [];

    for (const entity of schemaModel.concreteEntities) {
        if (entity.annotations.fulltext) {
            entity.annotations.fulltext.indexes.forEach((index) => {
                const indexName = index.indexName || index.name; // TODO remove indexName assignment and undefined check once the name argument has been removed.
                if (indexName === undefined) {
                    throw new Error("The name of the fulltext index should be defined using the indexName argument.");
                }
                const existingIndex = existingIndexes[indexName];
                if (!existingIndex) {
                    indexErrors.push(`Missing @fulltext index '${indexName}' on Node '${entity.name}'`);

                    return;
                }

                index.fields.forEach((field) => {
                    const attribute = entity.findAttribute(field);
                    if (!attribute) {
                        throw new Error(`Attribute '${field}' not found in entity '${entity.name}'`);
                    }

                    const fieldName = attribute.databaseName || field;

                    const property = existingIndex.properties.find((p) => p === fieldName);
                    if (!property) {
                        const aliasError = attribute.databaseName ? ` aliased to field '${fieldName}'` : "";

                        indexErrors.push(
                            `@fulltext index '${indexName}' on Node '${entity.name}' is missing field '${field}'${aliasError}`
                        );
                    }
                });
            });
        }
    }

    if (indexErrors.length) {
        throw new Error(indexErrors.join("\n"));
    }

    debug("Successfully checked for the existence of all necessary indexes");
}

type MissingConstraint = { constraintName: string; label: string; property: string };

async function getMissingConstraints({
    schemaModel,
    session,
}: {
    schemaModel: Neo4jGraphQLSchemaModel;
    session: Session;
}): Promise<MissingConstraint[]> {
    const existingConstraints: Record<string, string[]> = {};

    const constraintsCypher = "SHOW UNIQUE CONSTRAINTS";
    debug(`About to execute Cypher: ${constraintsCypher}`);
    const constraintsResult = await session.run<{ labelsOrTypes: [string]; properties: [string] }>(constraintsCypher);

    constraintsResult.records
        .map((record) => {
            return record.toObject();
        })
        .forEach((constraint) => {
            const label = constraint.labelsOrTypes[0];
            const property = constraint.properties[0];

            const existingConstraint = existingConstraints[label];

            if (existingConstraint) {
                existingConstraint.push(property);
            } else {
                existingConstraints[label] = [property];
            }
        });

    const missingConstraints: MissingConstraint[] = [];

    for (const entity of schemaModel.concreteEntities) {
        const entityAdapter = new ConcreteEntityAdapter(entity);
        for (const uniqueField of entityAdapter.uniqueFields) {
            if (!uniqueField.annotations.unique) {
                continue;
            }

            let anyLabelHasConstraint = false;
            for (const label of entity.labels) {
                // If any of the constraints for the label already exist, skip to the next unique field
                if (existingConstraints[label]?.includes(uniqueField.databaseName)) {
                    anyLabelHasConstraint = true;
                    break;
                }
            }
            if (anyLabelHasConstraint === false) {
                const constraintName =
                    uniqueField.annotations.unique.constraintName || `${entity.name}_${uniqueField.databaseName}`;

                missingConstraints.push({
                    constraintName,
                    label: entityAdapter.getMainLabel(),
                    property: uniqueField.databaseName,
                });
            }
        }
    }

    return missingConstraints;
}
