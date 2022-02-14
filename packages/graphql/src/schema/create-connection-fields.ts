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

import { GraphQLResolveInfo } from "graphql";
import { InterfaceTypeComposer, ObjectTypeComposer, SchemaComposer } from "graphql-compose";
import { Node, Relationship } from "../classes";
import { ConnectionField, ConnectionQueryArgs } from "../types";
import { ObjectFields } from "./get-obj-field-meta";
import getSortableFields from "./get-sortable-fields";
import { addDirectedArgument } from "./directed-argument";
import { connectionFieldResolver } from "./pagination";

function createConnectionFields({
    connectionFields,
    schemaComposer,
    composeNode,
    nodes,
    relationshipPropertyFields,
}: {
    connectionFields: ConnectionField[];
    schemaComposer: SchemaComposer;
    composeNode: ObjectTypeComposer | InterfaceTypeComposer;
    nodes: Node[];
    relationshipPropertyFields: Map<string, ObjectFields>;
}): Relationship[] {
    const relationships: Relationship[] = [];

    const whereInput = schemaComposer.getITC(`${composeNode.getTypeName()}Where`);

    connectionFields.forEach((connectionField) => {
        const relationship = schemaComposer.getOrCreateOTC(connectionField.relationshipTypeName, (tc) => {
            tc.addFields({
                cursor: "String!",
                node: `${connectionField.relationship.typeMeta.name}!`,
            });
        });

        const connectionWhereName = `${connectionField.typeMeta.name}Where`;

        const connectionWhere = schemaComposer.getOrCreateITC(connectionWhereName);

        if (!connectionField.relationship.union) {
            connectionWhere.addFields({
                AND: `[${connectionWhereName}!]`,
                OR: `[${connectionWhereName}!]`,
            });
        }

        const connection = schemaComposer.getOrCreateOTC(connectionField.typeMeta.name, (tc) => {
            tc.addFields({
                edges: relationship.NonNull.List.NonNull,
                totalCount: "Int!",
                pageInfo: "PageInfo!",
            });
        });

        if (connectionField.relationship.properties && !connectionField.relationship.union) {
            const propertiesInterface = schemaComposer.getIFTC(connectionField.relationship.properties);
            relationship.addInterface(propertiesInterface);
            relationship.addFields(propertiesInterface.getFields());

            connectionWhere.addFields({
                edge: `${connectionField.relationship.properties}Where`,
                edge_NOT: `${connectionField.relationship.properties}Where`,
            });
        }

        whereInput.addFields({
            [connectionField.fieldName]: connectionWhere,
            [`${connectionField.fieldName}_NOT`]: connectionWhere,
        });

        // n..m Relationships
        if (connectionField.relationship.typeMeta.array) {
            // Add filters for each list predicate
            whereInput.addFields(
                (["ALL", "NONE", "SINGLE", "SOME"] as const).reduce(
                    (acc, filter) => ({
                        ...acc,
                        [`${connectionField.fieldName}_${filter}`]: connectionWhere,
                    }),
                    {}
                )
            );

            // Deprecate existing filters
            whereInput.setFieldDirectiveByName(connectionField.fieldName, "deprecated", {
                reason: `Use \`${connectionField.fieldName}_SOME\` instead.`,
            });
            whereInput.setFieldDirectiveByName(`${connectionField.fieldName}_NOT`, "deprecated", {
                reason: `Use \`${connectionField.fieldName}_NONE\` instead.`,
            });
        }

        const composeNodeBaseArgs: {
            where: any;
            sort?: any;
            first?: any;
            after?: any;
        } = {
            where: connectionWhere,
            first: {
                type: "Int",
            },
            after: {
                type: "String",
            },
        };

        const composeNodeArgs = addDirectedArgument(composeNodeBaseArgs, connectionField.relationship);

        if (connectionField.relationship.properties) {
            const connectionSort = schemaComposer.getOrCreateITC(`${connectionField.typeMeta.name}Sort`);
            connectionSort.addFields({
                edge: `${connectionField.relationship.properties}Sort`,
            });
            composeNodeArgs.sort = connectionSort.NonNull.List;
        }

        if (connectionField.relationship.interface) {
            connectionWhere.addFields({
                OR: connectionWhere.NonNull.List,
                AND: connectionWhere.NonNull.List,
                node: `${connectionField.relationship.typeMeta.name}Where`,
                node_NOT: `${connectionField.relationship.typeMeta.name}Where`,
            });

            if (schemaComposer.has(`${connectionField.relationship.typeMeta.name}Sort`)) {
                const connectionSort = schemaComposer.getOrCreateITC(`${connectionField.typeMeta.name}Sort`);
                connectionSort.addFields({
                    node: `${connectionField.relationship.typeMeta.name}Sort`,
                });
                if (!composeNodeArgs.sort) {
                    composeNodeArgs.sort = connectionSort.NonNull.List;
                }
            }

            if (connectionField.relationship.properties) {
                const propertiesInterface = schemaComposer.getIFTC(connectionField.relationship.properties);
                relationship.addInterface(propertiesInterface);
                relationship.addFields(propertiesInterface.getFields());

                connectionWhere.addFields({
                    edge: `${connectionField.relationship.properties}Where`,
                    edge_NOT: `${connectionField.relationship.properties}Where`,
                });
            }
        } else if (connectionField.relationship.union) {
            const relatedNodes = nodes.filter((n) => connectionField.relationship.union?.nodes?.includes(n.name));

            relatedNodes.forEach((n) => {
                const connectionName = connectionField.typeMeta.name;

                // Append union member name before "ConnectionWhere"
                const unionWhereName = `${connectionName.substring(0, connectionName.length - "Connection".length)}${
                    n.name
                }ConnectionWhere`;

                const unionWhere = schemaComposer.createInputTC({
                    name: unionWhereName,
                    fields: {
                        OR: `[${unionWhereName}!]`,
                        AND: `[${unionWhereName}!]`,
                    },
                });

                unionWhere.addFields({
                    node: `${n.name}Where`,
                    node_NOT: `${n.name}Where`,
                });

                if (connectionField.relationship.properties) {
                    const propertiesInterface = schemaComposer.getIFTC(connectionField.relationship.properties);
                    relationship.addInterface(propertiesInterface);
                    relationship.addFields(propertiesInterface.getFields());

                    unionWhere.addFields({
                        edge: `${connectionField.relationship.properties}Where`,
                        edge_NOT: `${connectionField.relationship.properties}Where`,
                    });
                }

                connectionWhere.addFields({
                    [n.name]: unionWhere,
                });
            });
        } else {
            const relatedNode = nodes.find((n) => n.name === connectionField.relationship.typeMeta.name) as Node;

            connectionWhere.addFields({
                node: `${connectionField.relationship.typeMeta.name}Where`,
                node_NOT: `${connectionField.relationship.typeMeta.name}Where`,
            });

            if (getSortableFields(relatedNode).length) {
                const connectionSort = schemaComposer.getOrCreateITC(`${connectionField.typeMeta.name}Sort`);
                connectionSort.addFields({
                    node: `${connectionField.relationship.typeMeta.name}Sort`,
                });
                if (!composeNodeArgs.sort) {
                    composeNodeArgs.sort = connectionSort.NonNull.List;
                }
            }
        }

        if (!connectionField.relationship.writeonly) {
            composeNode.addFields({
                [connectionField.fieldName]: {
                    type: connection.NonNull,
                    args: composeNodeArgs,
                    resolve: (source, args: ConnectionQueryArgs, ctx, info: GraphQLResolveInfo) => {
                        return connectionFieldResolver({
                            connectionField,
                            args,
                            info,
                            source,
                        });
                    },
                },
            });
        }

        const relFields = connectionField.relationship.properties
            ? relationshipPropertyFields.get(connectionField.relationship.properties)
            : ({} as ObjectFields | undefined);

        const r = new Relationship({
            name: connectionField.relationshipTypeName,
            type: connectionField.relationship.type,
            properties: connectionField.relationship.properties,
            ...(relFields
                ? {
                      temporalFields: relFields.temporalFields,
                      scalarFields: relFields.scalarFields,
                      primitiveFields: relFields.primitiveFields,
                      pointFields: relFields.pointFields,
                      computedFields: relFields.computedFields,
                  }
                : {}),
        });
        relationships.push(r);
    });

    return relationships;
}

export default createConnectionFields;
