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
import type { ConcreteEntity } from "../../schema-model/entity/ConcreteEntity";
import type { Neo4jGraphQLSessionConfig } from "../Executor";

const debug = Debug(DEBUG_EXECUTE);

export interface AssertIndexesAndConstraintsOptions {
    create?: boolean;
}

export async function assertIndexesAndConstraints({
    driver,
    sessionConfig,
    schemaModel,
}: {
    driver: Driver;
    sessionConfig?: Neo4jGraphQLSessionConfig;
    schemaModel: Neo4jGraphQLSchemaModel;
}): Promise<void> {
    await driver.verifyConnectivity();

    const session = driver.session(sessionConfig);

    try {
        await checkIndexesAndConstraints({ schemaModel, session });
    } finally {
        await session.close();
    }
}

type ExistingIndexes = Record<
    string,
    { labelsOrTypes: string; properties: string[]; options: Record<string, unknown> }
>;

async function getExistingIndexes({ session }: { session: Session }): Promise<ExistingIndexes> {
    const existingIndexes: ExistingIndexes = {};

    const indexesCypher = `
        SHOW INDEXES YIELD
        name AS name,
        type AS type,
        entityType AS entityType,
        labelsOrTypes AS labelsOrTypes,
        properties AS properties,
        options AS options
    `;

    debug(`About to execute Cypher: ${indexesCypher}`);
    const indexesResult = await session.run(indexesCypher);

    indexesResult.records.forEach((record) => {
        const index = record.toObject();

        if ((index.type !== "FULLTEXT" && index.type !== "VECTOR") || index.entityType !== "NODE") {
            return;
        }

        if (existingIndexes[index.name]) {
            return;
        }

        existingIndexes[index.name] = {
            labelsOrTypes: index.labelsOrTypes,
            properties: index.properties,
            options: index.options,
        };
    });

    return existingIndexes;
}

function checkVectorIndexes(entity: ConcreteEntity, existingIndexes: ExistingIndexes, indexErrors: string[]): void {
    if (entity.annotations.vector) {
        entity.annotations.vector.indexes.forEach((index) => {
            const existingIndex = existingIndexes[index.indexName];

            if (!existingIndex) {
                indexErrors.push(`Missing @vector index '${index.indexName}' on Node '${entity.name}'`);

                return;
            }

            const propertyIsInIndex = existingIndex.properties.some((p) => p === index.embeddingProperty);
            if (!propertyIsInIndex) {
                indexErrors.push(
                    `@vector index '${index.indexName}' on Node '${entity.name}' is missing embedding property '${index.embeddingProperty}'`
                );
            }

            if (!existingIndex.options) {
                indexErrors.push(`@vector index '${index.indexName}' on Node '${entity.name}' is missing options`);

                return;
            }

            const indexConfig = existingIndex.options["indexConfig"];
            if (!indexConfig) {
                indexErrors.push(`@vector index '${index.indexName}' on Node '${entity.name}' is missing indexConfig`);

                return;
            }
        });
    }
}

async function checkIndexesAndConstraints({
    schemaModel,
    session,
}: {
    schemaModel: Neo4jGraphQLSchemaModel;
    session: Session;
}): Promise<void> {
    const missingConstraints = await getMissingConstraints({ session });

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
                const indexName = index.indexName;

                const existingIndex = existingIndexes[indexName];
                if (!existingIndex) {
                    indexErrors.push(`Missing @fulltext index '${indexName}' on Node '${entity.name}'`);

                    return;
                }

                // An index with the same name already exists, so we check that all index fields are included in the existing index
                index.fields.forEach((field) => {
                    const attribute = entity.findAttribute(field);
                    if (!attribute) {
                        throw new Error(`Attribute '${field}' not found in entity '${entity.name}'`);
                    }

                    const propertyIsInIndex = existingIndex.properties.some((p) => p === attribute.databaseName);
                    if (!propertyIsInIndex) {
                        const aliasError =
                            attribute.databaseName !== attribute.name
                                ? ` aliased to field '${attribute.databaseName}'`
                                : "";

                        indexErrors.push(
                            `@fulltext index '${indexName}' on Node '${entity.name}' is missing field '${field}'${aliasError}`
                        );
                    }
                });
            });
        }

        checkVectorIndexes(entity, existingIndexes, indexErrors);
    }

    if (indexErrors.length) {
        throw new Error(indexErrors.join("\n"));
    }

    debug("Successfully checked for the existence of all necessary indexes");
}

type MissingConstraint = { constraintName: string; label: string; property: string };

async function getMissingConstraints({ session }: { session: Session }): Promise<MissingConstraint[]> {
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

    return missingConstraints;
}
