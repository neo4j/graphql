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
    EnumTypeDefinitionNode,
    FloatValueNode,
    InterfaceTypeDefinitionNode,
    IntValueNode,
    ListValueNode,
    NamedTypeNode,
    ObjectTypeDefinitionNode,
    ScalarTypeDefinitionNode,
    StringValueNode,
    EnumValueNode,
    UnionTypeDefinitionNode,
    ValueNode,
    DirectiveNode,
} from "graphql";
import { Kind } from "graphql";
import getAuth from "./get-auth";
import getAliasMeta from "./get-alias-meta";
import { getCypherMeta } from "./get-cypher-meta";
import getFieldTypeMeta from "./get-field-type-meta";
import getCustomResolverMeta from "./get-custom-resolver-meta";
import getRelationshipMeta from "./get-relationship-meta";
import getUniqueMeta from "./parse/get-unique-meta";
import { SCALAR_TYPES } from "../constants";
import type {
    RelationField,
    CypherField,
    PrimitiveField,
    BaseField,
    CustomEnumField,
    CustomScalarField,
    UnionField,
    InterfaceField,
    ObjectField,
    TemporalField,
    PointField,
    TimeStampOperations,
    ConnectionField,
    CustomResolverField,
    Neo4jGraphQLCallbacks,
} from "../types";
import parseValueNode from "./parse-value-node";
import checkDirectiveCombinations from "./check-directive-combinations";
import { upperFirst } from "../utils/upper-first";
import { getCallbackMeta, getPopulatedByMeta } from "./get-populated-by-meta";

const deprecationWarning =
    "The @callback directive has been deprecated and will be removed in version 4.0. Please use @populatedBy instead." +
    "More information can be found at " +
    "https://neo4j.com/docs/graphql-manual/current/guides/v4-migration/#_callback_renamed_to_populatedby.";

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

let callbackDeprecatedWarningShown = false;

function getObjFieldMeta({
    obj,
    objects,
    interfaces,
    scalars,
    unions,
    enums,
    callbacks,
    customResolvers,
    validateResolvers,
}: {
    obj: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode;
    objects: ObjectTypeDefinitionNode[];
    interfaces: InterfaceTypeDefinitionNode[];
    unions: UnionTypeDefinitionNode[];
    scalars: ScalarTypeDefinitionNode[];
    enums: EnumTypeDefinitionNode[];
    validateResolvers: boolean;
    callbacks?: Neo4jGraphQLCallbacks;
    customResolvers?: IResolvers | Array<IResolvers>;
}) {
    const objInterfaceNames = [...(obj.interfaces || [])] as NamedTypeNode[];
    const objInterfaces = interfaces.filter((i) => objInterfaceNames.map((n) => n.name.value).includes(i.name.value));
    const objIsJwtPayload = (obj.directives || []).find((d) => d.name.value === "jwtPayload");

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

            checkDirectiveCombinations(directives);

            if (directives.some((x) => x.name.value === "private")) {
                return res;
            }

            const relationshipMeta = getRelationshipMeta(field, interfaceField);
            const cypherMeta = getCypherMeta(field, interfaceField);
            const customResolverMeta = getCustomResolverMeta(
                field,
                obj,
                validateResolvers,
                customResolvers,
                interfaceField
            );
            const typeMeta = getFieldTypeMeta(field.type);
            const authDirective = directives.find((x) => x.name.value === "auth");
            const idDirective = directives.find((x) => x.name.value === "id");
            const defaultDirective = directives.find((x) => x.name.value === "default");
            const coalesceDirective = directives.find((x) => x.name.value === "coalesce");
            const timestampDirective = directives.find((x) => x.name.value === "timestamp");
            const aliasDirective = directives.find((x) => x.name.value === "alias");
            const callbackDirective = directives.find((x) => x.name.value === "callback");
            const populatedByDirective = directives.find((x) => x.name.value === "populatedBy");
            const jwtClaimDirective = directives.find((x) => x.name.value === "jwtClaim");

            const unique = getUniqueMeta(directives, obj, field.name.value);

            const fieldInterface = interfaces.find((x) => x.name.value === typeMeta.name);
            const fieldUnion = unions.find((x) => x.name.value === typeMeta.name);
            const fieldScalar = scalars.find((x) => x.name.value === typeMeta.name);
            const fieldEnum = enums.find((x) => x.name.value === typeMeta.name);
            const fieldObject = objects.find((x) => x.name.value === typeMeta.name);

            const baseField: BaseField = {
                fieldName: field.name.value,
                dbPropertyName: field.name.value,
                typeMeta,
                otherDirectives: (directives || []).filter(
                    (x) =>
                        ![
                            "relationship",
                            "cypher",
                            "id",
                            "auth",
                            "authorization",
                            "readonly",
                            "writeonly",
                            "computed",
                            "customResolver",
                            "default",
                            "coalesce",
                            "timestamp",
                            "alias",
                            "unique",
                            "callback",
                            "populatedBy",
                            "jwtClaim",
                        ].includes(x.name.value)
                ),
                arguments: [...(field.arguments || [])],
                ...(authDirective ? { auth: getAuth(authDirective) } : {}),
                description: field.description?.value,
                readonly:
                    directives.some((d) => d.name.value === "readonly") ||
                    interfaceField?.directives?.some((x) => x.name.value === "readonly"),
                writeonly:
                    directives.some((d) => d.name.value === "writeonly") ||
                    interfaceField?.directives?.some((x) => x.name.value === "writeonly"),
                ...(unique ? { unique } : {}),
            };

            if (aliasDirective) {
                const aliasMeta = getAliasMeta(aliasDirective);
                if (aliasMeta) {
                    baseField.dbPropertyName = aliasMeta.property;
                }
            }

            if (jwtClaimDirective) {
                if (!objIsJwtPayload) {
                    throw new Error(
                        "@jwtClaim directive can only be used on fields within a type annotated with @jwtPayload"
                    );
                }
                if ((field.directives as DirectiveNode[]).length > 1) {
                    throw new Error("@jwtClaim directive cannot be combined with other directives.");
                }
            }

            if (relationshipMeta) {
                if (authDirective) {
                    throw new Error("cannot have auth directive on a relationship");
                }

                if (defaultDirective) {
                    throw new Error("@default directive can only be used on primitive type fields");
                }

                if (coalesceDirective) {
                    throw new Error("@coalesce directive can only be used on primitive type fields");
                }

                if (aliasDirective) {
                    throw new Error("@alias directive cannot be used on relationship fields");
                }

                const msg = `List type relationship fields must be non-nullable and have non-nullable entries, please change type of ${obj.name.value}.${field.name.value} to [${baseField.typeMeta.name}!]!`;

                if (typeMeta.originalType?.kind === "NonNullType") {
                    if (typeMeta.originalType?.type.kind === "ListType") {
                        if (typeMeta.originalType?.type.type.kind !== "NonNullType") {
                            throw new Error(msg);
                        }
                    }
                } else if (typeMeta.originalType?.kind === "ListType") {
                    throw new Error(msg);
                }

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
                if (defaultDirective) {
                    throw new Error("@default directive can only be used on primitive type fields");
                }

                if (coalesceDirective) {
                    throw new Error("@coalesce directive can only be used on primitive type fields");
                }

                if (aliasDirective) {
                    throw new Error("@alias directive cannot be used on cypher fields");
                }

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
                if (defaultDirective) {
                    throw new Error("@default directive can only be used on primitive type fields");
                }
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
                        if (!defaultValue || !isListValue(defaultValue)) {
                            throw new Error("@default value on enum list fields must be a list of enums");
                        }

                        enumField.defaultValue = defaultValue.values.map((v) => {
                            if (!v || !isEnumValue(v)) {
                                throw new Error("@default value on enum list fields must be a list of enums");
                            }

                            return v.value;
                        });
                    } else {
                        if (!defaultValue || !isEnumValue(defaultValue)) {
                            throw new Error("@default value on enum fields must be an enum value");
                        }

                        enumField.defaultValue = defaultValue.value;
                    }
                }

                if (coalesceDirective) {
                    const coalesceValue = coalesceDirective.arguments?.find((a) => a.name.value === "value")?.value;

                    if (enumField.typeMeta.array) {
                        if (!coalesceValue || !isListValue(coalesceValue)) {
                            throw new Error("@coalesce value on enum list fields must be a list of enums");
                        }

                        enumField.coalesceValue = coalesceValue.values.map((v) => {
                            if (!v || !isEnumValue(v)) {
                                throw new Error("@coalesce value on enum list fields must be a list of enums");
                            }

                            return v.value;
                        });
                    } else {
                        if (!coalesceValue || !isEnumValue(coalesceValue)) {
                            throw new Error("@coalesce value on enum fields must be an enum value");
                        }

                        // TODO: avoid duplication with primitives
                        enumField.coalesceValue = `"${coalesceValue.value}"`;
                    }
                }

                res.enumFields.push(enumField);
            } else if (fieldUnion) {
                if (defaultDirective) {
                    throw new Error("@default directive can only be used on primitive type fields");
                }

                if (coalesceDirective) {
                    throw new Error("@coalesce directive can only be used on primitive type fields");
                }

                const unionField: UnionField = {
                    ...baseField,
                };
                res.unionFields.push(unionField);
            } else if (fieldInterface) {
                if (defaultDirective) {
                    throw new Error("@default directive can only be used on primitive type fields");
                }

                if (coalesceDirective) {
                    throw new Error("@coalesce directive can only be used on primitive type fields");
                }

                res.interfaceFields.push({
                    ...baseField,
                });
            } else if (fieldObject) {
                if (defaultDirective) {
                    throw new Error("@default directive can only be used on primitive type fields");
                }

                if (coalesceDirective) {
                    throw new Error("@coalesce directive can only be used on primitive type fields");
                }

                const objectField: ObjectField = {
                    ...baseField,
                };
                res.objectFields.push(objectField);
            } else {
                if (["DateTime", "Date", "Time", "LocalDateTime", "LocalTime"].includes(typeMeta.name)) {
                    const temporalField: TemporalField = {
                        ...baseField,
                    };

                    if (timestampDirective) {
                        if (baseField.typeMeta.array) {
                            throw new Error("cannot auto-generate an array");
                        }

                        if (!["DateTime", "Time"].includes(typeMeta.name)) {
                            throw new Error("Cannot timestamp temporal fields lacking time zone information");
                        }

                        const operations = timestampDirective?.arguments?.find((x) => x.name.value === "operations")
                            ?.value as ListValueNode;

                        const timestamps = operations
                            ? (operations?.values.map((x) => parseValueNode(x)) as TimeStampOperations[])
                            : (["CREATE", "UPDATE"] as TimeStampOperations[]);

                        temporalField.timestamps = timestamps;
                    }

                    if (defaultDirective) {
                        const value = defaultDirective.arguments?.find((a) => a.name.value === "value")?.value;

                        if (Number.isNaN(Date.parse((value as StringValueNode).value))) {
                            throw new Error(
                                `Default value for ${obj.name.value}.${temporalField.fieldName} is not a valid DateTime`
                            );
                        }

                        temporalField.defaultValue = (value as StringValueNode).value;
                    }

                    if (coalesceDirective) {
                        throw new Error("@coalesce is not supported by DateTime fields at this time");
                    }

                    res.temporalFields.push(temporalField);
                } else if (["Point", "CartesianPoint"].includes(typeMeta.name)) {
                    if (defaultDirective) {
                        throw new Error("@default directive can only be used on primitive type fields");
                    }

                    if (coalesceDirective) {
                        throw new Error("@coalesce directive can only be used on primitive type fields");
                    }

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

                    if (callbackDirective) {
                        if (!callbackDeprecatedWarningShown) {
                            console.warn(deprecationWarning);
                            callbackDeprecatedWarningShown = true;
                        }
                        const callback = getCallbackMeta(callbackDirective, callbacks);
                        primitiveField.callback = callback;
                    }

                    if (idDirective) {
                        const autogenerate = idDirective.arguments?.find((a) => a.name.value === "autogenerate");
                        if (!autogenerate || (autogenerate.value as BooleanValueNode).value) {
                            if (baseField.typeMeta.name !== "ID") {
                                throw new Error("cannot auto-generate a non ID field");
                            }

                            if (baseField.typeMeta.array) {
                                throw new Error("cannot auto-generate an array");
                            }

                            primitiveField.autogenerate = true;
                        }
                        const global = idDirective.arguments?.find((a) => a.name.value === "global");
                        if (global) {
                            primitiveField.isGlobalIdField = true;
                        }
                    }

                    if (defaultDirective) {
                        const value = defaultDirective.arguments?.find((a) => a.name.value === "value")?.value;

                        const checkKind = (kind: string) => {
                            if (value?.kind !== kind) {
                                throw new Error(
                                    `Default value for ${obj.name.value}.${primitiveField.fieldName} does not have matching type ${primitiveField.typeMeta.name}`
                                );
                            }
                        };

                        switch (baseField.typeMeta.name) {
                            case "ID":
                            case "String":
                                checkKind(Kind.STRING);
                                primitiveField.defaultValue = (value as StringValueNode).value;
                                break;
                            case "Boolean":
                                checkKind(Kind.BOOLEAN);
                                primitiveField.defaultValue = (value as BooleanValueNode).value;
                                break;
                            case "Int":
                                checkKind(Kind.INT);
                                primitiveField.defaultValue = parseInt((value as IntValueNode).value, 10);
                                break;
                            case "Float":
                                checkKind(Kind.FLOAT);
                                primitiveField.defaultValue = parseFloat((value as FloatValueNode).value);
                                break;
                            default:
                                throw new Error(
                                    "@default directive can only be used on types: Int | Float | String | Boolean | ID | DateTime | Enum"
                                );
                        }
                    }

                    if (coalesceDirective) {
                        const value = coalesceDirective.arguments?.find((a) => a.name.value === "value")?.value;

                        const checkKind = (kind: string) => {
                            if (value?.kind !== kind) {
                                throw new Error(
                                    `coalesce() value for ${obj.name.value}.${primitiveField.fieldName} does not have matching type ${primitiveField.typeMeta.name}`
                                );
                            }
                        };

                        switch (baseField.typeMeta.name) {
                            case "ID":
                            case "String":
                                checkKind(Kind.STRING);
                                primitiveField.coalesceValue = `"${(value as StringValueNode).value}"`;
                                break;
                            case "Boolean":
                                checkKind(Kind.BOOLEAN);
                                primitiveField.coalesceValue = (value as BooleanValueNode).value;
                                break;
                            case "Int":
                                checkKind(Kind.INT);
                                primitiveField.coalesceValue = parseInt((value as IntValueNode).value, 10);
                                break;
                            case "Float":
                                checkKind(Kind.FLOAT);
                                primitiveField.coalesceValue = parseFloat((value as FloatValueNode).value);
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

function isEnumValue(value: ValueNode): value is EnumValueNode {
    return value.kind === Kind.ENUM;
}

function isListValue(value: ValueNode): value is ListValueNode {
    return value.kind === Kind.LIST;
}

export default getObjFieldMeta;
