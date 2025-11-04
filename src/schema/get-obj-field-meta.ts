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

import type { IResolvers } from "@graphql-tools/utils";
import type {
    BooleanValueNode,
    DirectiveNode,
    EnumTypeDefinitionNode,
    EnumValueNode,
    InterfaceTypeDefinitionNode,
    ListValueNode,
    NamedTypeNode,
    ObjectTypeDefinitionNode,
    ScalarTypeDefinitionNode,
    StringValueNode,
    UnionTypeDefinitionNode,
} from "graphql";
import { Kind } from "graphql";
import { SCALAR_TYPES, SPATIAL_TYPES, TEMPORAL_SCALAR_TYPES } from "../constants";
import { parseArgumentsFromUnknownDirective } from "../schema-model/parser/parse-arguments";
import { parseValueNode } from "../schema-model/parser/parse-value-node";
import type {
    BaseField,
    ConnectionField,
    CustomEnumField,
    CustomResolverField,
    CustomScalarField,
    CypherField,
    FilterableOptions,
    InterfaceField,
    Neo4jGraphQLCallbacks,
    ObjectField,
    PointField,
    PrimitiveField,
    RelationField,
    SelectableOptions,
    SettableOptions,
    TemporalField,
    TimeStampOperations,
    UnionField,
} from "../types";
import { upperFirst } from "../utils/upper-first";
import getAliasMeta from "./get-alias-meta";
import { getCustomResolverMeta } from "./get-custom-resolver-meta";
import { getCypherMeta } from "./get-cypher-meta";
import getFieldTypeMeta from "./get-field-type-meta";
import { getPopulatedByMeta } from "./get-populated-by-meta";
import getRelationshipMeta from "./get-relationship-meta";
import getUniqueMeta from "./parse/get-unique-meta";

export interface ObjectFields {
    relationFields: RelationField[];
    connectionFields: ConnectionField[];
    primitiveFields: PrimitiveField[];
    cypherFields: CypherField[];
    scalarFields: CustomScalarField[];
    enumFields: CustomEnumField[];
    unionFields: UnionField[];
    interfaceFields: InterfaceField[];
    objectFields: ObjectField[];
    temporalFields: TemporalField[];
    pointFields: PointField[];
    customResolverFields: CustomResolverField[];
}

function getObjFieldMeta({
    obj,
    objects,
    interfaces,
    scalars,
    unions,
    enums,
    callbacks,
    customResolvers,
}: {
    obj: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode;
    objects: ObjectTypeDefinitionNode[];
    interfaces: InterfaceTypeDefinitionNode[];
    unions: UnionTypeDefinitionNode[];
    scalars: ScalarTypeDefinitionNode[];
    enums: EnumTypeDefinitionNode[];
    callbacks?: Neo4jGraphQLCallbacks;
    customResolvers?: IResolvers | Array<IResolvers>;
}): ObjectFields {
    const objInterfaceNames = [...(obj.interfaces || [])] as NamedTypeNode[];
    const objInterfaces = interfaces.filter((i) => objInterfaceNames.map((n) => n.name.value).includes(i.name.value));

    return obj?.fields?.reduce(
        (res: ObjectFields, field) => {
            const interfaceField = objInterfaces
                .find((i) => i.fields?.map((f) => f.name.value).includes(field.name.value))
                ?.fields?.find((f) => f.name.value === field.name.value);

            // Create array of directives for this field. Field directives override interface field directives.
            const directives = [
                ...(field?.directives || []),
                ...(interfaceField?.directives || []).filter(
                    (d) => !field.directives?.find((fd) => fd.name.value === d.name.value)
                ),
            ];

            if (directives.some((x) => x.name.value === "private")) {
                return res;
            }

            const relationshipMeta = getRelationshipMeta(field, interfaceField);
            const cypherMeta = getCypherMeta(field, interfaceField);
            const customResolverMeta = getCustomResolverMeta({
                field,
                object: obj,
                objects,
                interfaces,
                unions,
                customResolvers,
                interfaceField,
            });
            const typeMeta = getFieldTypeMeta(field.type);
            const idDirective = directives.find((x) => x.name.value === "id");
            const relayIdDirective = directives.find((x) => x.name.value === "relayId");
            const defaultDirective = directives.find((x) => x.name.value === "default");
            const coalesceDirective = directives.find((x) => x.name.value === "coalesce");
            const timestampDirective = directives.find((x) => x.name.value === "timestamp");
            const aliasDirective = directives.find((x) => x.name.value === "alias");
            const populatedByDirective = directives.find((x) => x.name.value === "populatedBy");
            const selectableDirective = directives.find((x) => x.name.value === "selectable");
            const settableDirective = directives.find((x) => x.name.value === "settable");
            const filterableDirective = directives.find((x) => x.name.value === "filterable");
            const unique = getUniqueMeta(directives, obj, field.name.value);

            const fieldInterface = interfaces.find((x) => x.name.value === typeMeta.name);
            const fieldUnion = unions.find((x) => x.name.value === typeMeta.name);
            const fieldScalar = scalars.find((x) => x.name.value === typeMeta.name);
            const fieldEnum = enums.find((x) => x.name.value === typeMeta.name);
            const fieldObject = objects.find((x) => x.name.value === typeMeta.name);
            const fieldTemporal = TEMPORAL_SCALAR_TYPES.includes(typeMeta.name);
            const fieldPoint = SPATIAL_TYPES.includes(typeMeta.name);

            const selectableOptions = parseSelectableDirective(selectableDirective);
            const settableOptions = parseSettableDirective(settableDirective);
            const filterableOptions = parseFilterableDirective(filterableDirective);

            const baseField: BaseField = {
                fieldName: field.name.value,
                dbPropertyName: field.name.value,
                typeMeta,
                selectableOptions,
                settableOptions,
                filterableOptions,
                otherDirectives: (directives || []).filter(
                    (x) =>
                        ![
                            "relationship",
                            "cypher",
                            "id",
                            "authorization",
                            "authentication",
                            "customResolver",
                            "default",
                            "coalesce",
                            "timestamp",
                            "alias",
                            "unique",
                            "callback",
                            "populatedBy",
                            "jwtClaim",
                            "selectable",
                            "settable",
                            "subscriptionsAuthorization",
                            "filterable",
                            "relayId",
                        ].includes(x.name.value)
                ),
                arguments: [...(field.arguments || [])],
                description: field.description?.value,
                ...(unique ? { unique } : {}),
            };

            if (aliasDirective) {
                const aliasMeta = getAliasMeta(aliasDirective);
                if (aliasMeta) {
                    baseField.dbPropertyName = aliasMeta.property;
                    baseField.dbPropertyNameUnescaped = aliasMeta.propertyUnescaped;
                }
            }

            if (relationshipMeta) {
                const relationField: RelationField = {
                    ...baseField,
                    ...relationshipMeta,
                    inherited: false,
                };

                if (fieldUnion) {
                    const nodes: string[] = [];

                    fieldUnion.types?.forEach((type) => {
                        nodes.push(type.name.value);
                    });

                    const unionField: UnionField = {
                        ...baseField,
                        nodes,
                    };

                    relationField.union = unionField;
                }

                if (fieldInterface) {
                    const implementations = objects
                        .filter((n) => n.interfaces?.some((i) => i.name.value === fieldInterface.name.value))
                        .map((n) => n.name.value);

                    relationField.interface = {
                        ...baseField,
                        implementations,
                    };
                }

                // TODO: This will be brittle if more than one interface

                let connectionPrefix = obj.name.value;

                if (obj.interfaces && obj.interfaces.length) {
                    const firstInterface = obj.interfaces[0];
                    if (!firstInterface) {
                        throw new Error("Cannot get interface in getObjFieldMeta");
                    }

                    const inter = interfaces.find(
                        (i) => i.name.value === firstInterface.name.value
                    ) as InterfaceTypeDefinitionNode;

                    if (inter.fields?.some((f) => f.name.value === baseField.fieldName)) {
                        connectionPrefix = firstInterface.name.value;
                        relationField.inherited = true;
                    }
                }

                relationField.connectionPrefix = connectionPrefix;

                const connectionTypeName = `${connectionPrefix}${upperFirst(`${baseField.fieldName}Connection`)}`;
                const relationshipTypeName = `${connectionPrefix}${upperFirst(`${baseField.fieldName}Relationship`)}`;

                const connectionField: ConnectionField = {
                    fieldName: `${baseField.fieldName}Connection`,
                    relationshipTypeName,
                    selectableOptions,
                    settableOptions,
                    filterableOptions,
                    typeMeta: {
                        name: connectionTypeName,
                        required: true,
                        pretty: `${connectionTypeName}!`,
                        input: {
                            where: {
                                type: `${connectionTypeName}Where`,
                                pretty: `${connectionTypeName}Where`,
                            },
                            create: {
                                type: "",
                                pretty: "",
                            },
                            update: {
                                type: "",
                                pretty: "",
                            },
                        },
                    },
                    otherDirectives: baseField.otherDirectives,
                    arguments: [...(field.arguments || [])],
                    description: field.description?.value,
                    relationship: relationField,
                };

                res.relationFields.push(relationField);
                res.connectionFields.push(connectionField);
                // }
            } else if (cypherMeta) {
                const cypherField: CypherField = {
                    ...baseField,
                    ...cypherMeta,
                    isEnum: !!fieldEnum,
                    isScalar: !!fieldScalar || SCALAR_TYPES.includes(typeMeta.name),
                };
                res.cypherFields.push(cypherField);
            } else if (customResolverMeta) {
                res.customResolverFields.push({ ...baseField, ...customResolverMeta });
            } else if (fieldScalar) {
                const scalarField: CustomScalarField = {
                    ...baseField,
                };
                res.scalarFields.push(scalarField);
            } else if (fieldEnum) {
                const enumField: CustomEnumField = {
                    kind: "Enum",
                    ...baseField,
                };

                if (defaultDirective) {
                    const defaultValue = defaultDirective.arguments?.find((a) => a.name.value === "value")?.value;

                    if (enumField.typeMeta.array) {
                        enumField.defaultValue = (defaultValue as ListValueNode).values.map((v) => {
                            return (v as EnumValueNode).value;
                        });
                    } else {
                        enumField.defaultValue = (defaultValue as EnumValueNode).value;
                    }
                }

                if (coalesceDirective) {
                    const coalesceValue = coalesceDirective.arguments?.find((a) => a.name.value === "value")?.value;

                    if (enumField.typeMeta.array) {
                        enumField.coalesceValue = (coalesceValue as ListValueNode).values.map((v) => {
                            return (v as EnumValueNode).value;
                        });
                    } else {
                        // TODO: avoid duplication with primitives
                        enumField.coalesceValue = `"${(coalesceValue as EnumValueNode).value}"`;
                    }
                }

                res.enumFields.push(enumField);
            } else if (fieldUnion) {
                const unionField: UnionField = {
                    ...baseField,
                };
                res.unionFields.push(unionField);
            } else if (fieldInterface) {
                res.interfaceFields.push({
                    ...baseField,
                });
            } else if (fieldObject) {
                const objectField: ObjectField = {
                    ...baseField,
                };
                res.objectFields.push(objectField);
            } else {
                if (fieldTemporal) {
                    const temporalField: TemporalField = {
                        ...baseField,
                    };

                    if (populatedByDirective) {
                        const callback = getPopulatedByMeta(populatedByDirective, callbacks);
                        temporalField.callback = callback;
                    }

                    if (timestampDirective) {
                        const operations = timestampDirective?.arguments?.find((x) => x.name.value === "operations")
                            ?.value as ListValueNode;

                        const timestamps = operations
                            ? (operations?.values.map((x) => parseValueNode(x)) as TimeStampOperations[])
                            : (["CREATE", "UPDATE"] as TimeStampOperations[]);

                        temporalField.timestamps = timestamps;
                    }

                    if (defaultDirective) {
                        const value = defaultDirective.arguments?.find((a) => a.name.value === "value")?.value;
                        temporalField.defaultValue = (value as StringValueNode).value;
                    }

                    res.temporalFields.push(temporalField);
                } else if (fieldPoint) {
                    const pointField: PointField = {
                        ...baseField,
                    };
                    res.pointFields.push(pointField);
                } else {
                    const primitiveField: PrimitiveField = {
                        ...baseField,
                    };

                    if (populatedByDirective) {
                        const callback = getPopulatedByMeta(populatedByDirective, callbacks);
                        primitiveField.callback = callback;
                    }

                    if (idDirective) {
                        // TODO: remove the following as the argument "autogenerate" does not exists anymore
                        const autogenerate = idDirective.arguments?.find((a) => a.name.value === "autogenerate");
                        if (!autogenerate || (autogenerate.value as BooleanValueNode).value) {
                            primitiveField.autogenerate = true;
                        }
                    }

                    if (relayIdDirective) {
                        primitiveField.isGlobalIdField = true;
                    }

                    if (defaultDirective) {
                        const value = defaultDirective.arguments?.find((a) => a.name.value === "value")?.value;

                        const typeError = `Default value for ${obj.name.value}.${primitiveField.fieldName} does not have matching type ${primitiveField.typeMeta.name}`;

                        switch (baseField.typeMeta.name) {
                            case "ID":
                            case "String":
                                if (value?.kind !== Kind.STRING) {
                                    throw new Error(typeError);
                                }
                                primitiveField.defaultValue = value.value;
                                break;
                            case "Boolean":
                                if (value?.kind !== Kind.BOOLEAN) {
                                    throw new Error(typeError);
                                }
                                primitiveField.defaultValue = value.value;
                                break;
                            case "Int":
                                if (value?.kind !== Kind.INT) {
                                    throw new Error(typeError);
                                }
                                primitiveField.defaultValue = parseInt(value.value, 10);
                                break;
                            case "Float":
                                if (value?.kind !== Kind.FLOAT) {
                                    throw new Error(typeError);
                                }
                                primitiveField.defaultValue = parseFloat(value.value);
                                break;
                            default:
                                throw new Error(
                                    "@default directive can only be used on types: Int | Float | String | Boolean | ID | DateTime | Enum"
                                );
                        }
                    }

                    if (coalesceDirective) {
                        const value = coalesceDirective.arguments?.find((a) => a.name.value === "value")?.value;

                        const typeError = `coalesce() value for ${obj.name.value}.${primitiveField.fieldName} does not have matching type ${primitiveField.typeMeta.name}`;

                        switch (baseField.typeMeta.name) {
                            case "ID":
                            case "String":
                                if (value?.kind !== Kind.STRING) {
                                    throw new Error(typeError);
                                }
                                primitiveField.coalesceValue = `"${value.value}"`;
                                break;
                            case "Boolean":
                                if (value?.kind !== Kind.BOOLEAN) {
                                    throw new Error(typeError);
                                }
                                primitiveField.coalesceValue = value.value;
                                break;
                            case "Int":
                                if (value?.kind !== Kind.INT) {
                                    throw new Error(typeError);
                                }
                                primitiveField.coalesceValue = parseInt(value.value, 10);
                                break;
                            case "Float":
                                if (value?.kind !== Kind.FLOAT) {
                                    throw new Error(typeError);
                                }
                                primitiveField.coalesceValue = parseFloat(value.value);
                                break;
                            default:
                                throw new Error(
                                    "@coalesce directive can only be used on types: Int | Float | String | Boolean | ID | DateTime"
                                );
                        }
                    }

                    res.primitiveFields.push(primitiveField);
                }
            }

            return res;
        },
        {
            relationFields: [],
            connectionFields: [],
            primitiveFields: [],
            cypherFields: [],
            scalarFields: [],
            enumFields: [],
            unionFields: [],
            interfaceFields: [],
            objectFields: [],
            temporalFields: [],
            pointFields: [],
            customResolverFields: [],
        }
    ) as ObjectFields;
}

export default getObjFieldMeta;

function parseSelectableDirective(directive: DirectiveNode | undefined): SelectableOptions {
    const defaultArguments = {
        onRead: true,
        onAggregate: true,
    };

    const args: Partial<SelectableOptions> = directive ? parseArgumentsFromUnknownDirective(directive) : {};

    return {
        onRead: args.onRead ?? defaultArguments.onRead,
        onAggregate: args.onAggregate ?? defaultArguments.onAggregate,
    };
}

function parseSettableDirective(directive: DirectiveNode | undefined): SettableOptions {
    const defaultArguments = {
        onCreate: true,
        onUpdate: true,
    };

    const args: Partial<SettableOptions> = directive ? parseArgumentsFromUnknownDirective(directive) : {};

    return {
        onCreate: args.onCreate ?? defaultArguments.onCreate,
        onUpdate: args.onUpdate ?? defaultArguments.onUpdate,
    };
}

function parseFilterableDirective(directive: DirectiveNode | undefined): FilterableOptions {
    const defaultArguments = {
        byValue: true,
        byAggregate: directive === undefined ? true : false,
    };

    const args: Partial<FilterableOptions> = directive ? parseArgumentsFromUnknownDirective(directive) : {};

    return {
        byValue: args.byValue ?? defaultArguments.byValue,
        byAggregate: args.byAggregate ?? defaultArguments.byAggregate,
    };
}
