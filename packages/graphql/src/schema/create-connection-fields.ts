import { GraphQLResolveInfo } from "graphql";
import { InterfaceTypeComposer, ObjectTypeComposer, SchemaComposer } from "graphql-compose";
import { Node, Relationship } from "../classes";
import { ConnectionField, ConnectionQueryArgs } from "../types";
import { ObjectFields } from "./get-obj-field-meta";
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

        let composeNodeArgs: {
            where: any;
            sort?: any;
            first?: any;
            after?: any;
        } = {
            where: connectionWhere,
        };

        if (connectionField.relationship.interface) {
            connectionWhere.addFields({
                OR: connectionWhere.NonNull.List,
                AND: connectionWhere.NonNull.List,
                node: `${connectionField.relationship.typeMeta.name}Where`,
                node_NOT: `${connectionField.relationship.typeMeta.name}Where`,
            });

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
                const unionWhereName = `${connectionField.typeMeta.name}${n.name}Where`;
                const unionWhere = schemaComposer.createInputTC({
                    name: unionWhereName,
                    fields: {
                        OR: `[${unionWhereName}]`,
                        AND: `[${unionWhereName}]`,
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

            const connectionSort = schemaComposer.getOrCreateITC(`${connectionField.typeMeta.name}Sort`);

            const nodeSortFields = [
                ...relatedNode.primitiveFields,
                ...relatedNode.enumFields,
                ...relatedNode.scalarFields,
                ...relatedNode.temporalFields,
                ...relatedNode.pointFields,
            ].filter((f) => !f.typeMeta.array);

            if (nodeSortFields.length) {
                connectionSort.addFields({
                    node: `${connectionField.relationship.typeMeta.name}Sort`,
                });
            }

            if (connectionField.relationship.properties) {
                connectionSort.addFields({
                    edge: `${connectionField.relationship.properties}Sort`,
                });
            }

            composeNodeArgs = {
                ...composeNodeArgs,
                first: {
                    type: "Int",
                },
                after: {
                    type: "String",
                },
            };

            // If any sortable fields, add sort argument to connection field
            if (nodeSortFields.length || connectionField.relationship.properties) {
                composeNodeArgs = {
                    ...composeNodeArgs,
                    sort: connectionSort.NonNull.List,
                };
            }
        }

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
                      ignoredFields: relFields.ignoredFields,
                  }
                : {}),
        });
        relationships.push(r);
    });

    return relationships;
}

export default createConnectionFields;
