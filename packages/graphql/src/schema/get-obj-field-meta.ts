import {
    BooleanValueNode,
    EnumTypeDefinitionNode,
    FloatValueNode,
    InterfaceTypeDefinitionNode,
    IntValueNode,
    Kind,
    ListValueNode,
    ObjectTypeDefinitionNode,
    ScalarTypeDefinitionNode,
    StringValueNode,
    UnionTypeDefinitionNode,
} from "graphql";
import getFieldTypeMeta from "./get-field-type-meta";
import getCypherMeta from "./get-cypher-meta";
import getAuth from "./get-auth";
import getRelationshipMeta from "./get-relationship-meta";
import {
    RelationField,
    CypherField,
    PrimitiveField,
    BaseField,
    CustomEnumField,
    CustomScalarField,
    UnionField,
    InterfaceField,
    ObjectField,
    DateTimeField,
    PointField,
    TimeStampOperations,
} from "../types";
import parseValueNode from "./parse-value-node";

interface ObjectFields {
    relationFields: RelationField[];
    primitiveFields: PrimitiveField[];
    cypherFields: CypherField[];
    scalarFields: CustomScalarField[];
    enumFields: CustomEnumField[];
    unionFields: UnionField[];
    interfaceFields: InterfaceField[];
    objectFields: ObjectField[];
    dateTimeFields: DateTimeField[];
    pointFields: PointField[];
    ignoredFields: BaseField[];
}

function getObjFieldMeta({
    obj,
    objects,
    interfaces,
    scalars,
    unions,
    enums,
}: {
    obj: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode;
    objects: ObjectTypeDefinitionNode[];
    interfaces: InterfaceTypeDefinitionNode[];
    unions: UnionTypeDefinitionNode[];
    scalars: ScalarTypeDefinitionNode[];
    enums: EnumTypeDefinitionNode[];
}) {
    return obj?.fields?.reduce(
        (res: ObjectFields, field) => {
            if (field?.directives?.some((x) => x.name.value === "private")) {
                return res;
            }

            const relationshipMeta = getRelationshipMeta(field);
            const cypherMeta = getCypherMeta(field);
            const typeMeta = getFieldTypeMeta(field);
            const authDirective = field.directives?.find((x) => x.name.value === "auth");
            const idDirective = field?.directives?.find((x) => x.name.value === "id");
            const defaultDirective = field?.directives?.find((x) => x.name.value === "default");
            const coalesceDirective = field?.directives?.find((x) => x.name.value === "coalesce");
            const timestampDirective = field?.directives?.find((x) => x.name.value === "timestamp");
            const fieldInterface = interfaces.find((x) => x.name.value === typeMeta.name);
            const fieldUnion = unions.find((x) => x.name.value === typeMeta.name);
            const fieldScalar = scalars.find((x) => x.name.value === typeMeta.name);
            const fieldEnum = enums.find((x) => x.name.value === typeMeta.name);
            const fieldObject = objects.find((x) => x.name.value === typeMeta.name);

            const baseField: BaseField = {
                fieldName: field.name.value,
                typeMeta,
                otherDirectives: (field.directives || []).filter(
                    (x) =>
                        ![
                            "relationship",
                            "cypher",
                            "id",
                            "auth",
                            "readonly",
                            "writeonly",
                            "ignore",
                            "default",
                            "coalesce",
                            "timestamp",
                        ].includes(x.name.value)
                ),
                arguments: [...(field.arguments || [])],
                ...(authDirective ? { auth: getAuth(authDirective) } : {}),
                description: field.description?.value,
                readonly: field?.directives?.some((d) => d.name.value === "readonly"),
                writeonly: field?.directives?.some((d) => d.name.value === "writeonly"),
            };

            if (relationshipMeta) {
                if (fieldInterface) {
                    throw new Error("cannot have interface on relationship");
                }

                if (authDirective) {
                    throw new Error("cannot have auth directive on a relationship");
                }

                if (defaultDirective) {
                    throw new Error("@default directive can only be used on primitive type fields");
                }

                if (coalesceDirective) {
                    throw new Error("@coalesce directive can only be used on primitive type fields");
                }

                const relationField: RelationField = {
                    ...baseField,
                    ...relationshipMeta,
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

                res.relationFields.push(relationField);
            } else if (cypherMeta) {
                if (defaultDirective) {
                    throw new Error("@default directive can only be used on primitive type fields");
                }

                if (coalesceDirective) {
                    throw new Error("@coalesce directive can only be used on primitive type fields");
                }

                const cypherField: CypherField = {
                    ...baseField,
                    ...cypherMeta,
                };
                res.cypherFields.push(cypherField);
            } else if (fieldScalar) {
                if (defaultDirective) {
                    throw new Error("@default directive can only be used on primitive type fields");
                }
                const scalarField: CustomScalarField = {
                    ...baseField,
                };
                res.scalarFields.push(scalarField);
            } else if (fieldEnum) {
                if (defaultDirective) {
                    throw new Error("@default directive can only be used on primitive type fields");
                }

                if (coalesceDirective) {
                    throw new Error("@coalesce directive can only be used on primitive type fields");
                }

                const enumField: CustomEnumField = {
                    ...baseField,
                };
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

                const interfaceField: InterfaceField = {
                    ...baseField,
                };
                res.interfaceFields.push(interfaceField);
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
            } else if (field.directives?.some((d) => d.name.value === "ignore")) {
                res.ignoredFields.push(baseField);
            } else {
                // eslint-disable-next-line no-lonely-if
                if (typeMeta.name === "DateTime") {
                    const dateTimeField: DateTimeField = {
                        ...baseField,
                    };

                    if (timestampDirective) {
                        if (baseField.typeMeta.array) {
                            throw new Error("cannot auto-generate an array");
                        }

                        const operations = timestampDirective?.arguments?.find((x) => x.name.value === "operations")
                            ?.value as ListValueNode;

                        const timestamps = operations?.values.map((x) => parseValueNode(x)) as TimeStampOperations[];

                        dateTimeField.timestamps = timestamps;
                    }

                    if (defaultDirective) {
                        const value = defaultDirective.arguments?.find((a) => a.name.value === "value")?.value;

                        if (Number.isNaN(Date.parse((value as StringValueNode).value))) {
                            throw new Error(
                                `Default value for ${obj.name.value}.${dateTimeField.fieldName} is not a valid DateTime`
                            );
                        }

                        dateTimeField.defaultValue = (value as StringValueNode).value;
                    }

                    if (coalesceDirective) {
                        throw new Error("@coalesce is not supported by DateTime fields at this time");
                    }

                    res.dateTimeFields.push(dateTimeField);
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

                    if (
                        (idDirective?.arguments?.find((a) => a.name.value === "autogenerate")
                            ?.value as BooleanValueNode)?.value
                    ) {
                        if (baseField.typeMeta.name !== "ID") {
                            throw new Error("cannot auto-generate a non ID field");
                        }

                        if (baseField.typeMeta.array) {
                            throw new Error("cannot auto-generate an array");
                        }

                        primitiveField.autogenerate = true;
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
                                    "@default directive can only be used on types: Int | Float | String | Boolean | ID | DateTime"
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
            primitiveFields: [],
            cypherFields: [],
            scalarFields: [],
            enumFields: [],
            unionFields: [],
            interfaceFields: [],
            objectFields: [],
            dateTimeFields: [],
            pointFields: [],
            ignoredFields: [],
        }
    ) as ObjectFields;
}

export default getObjFieldMeta;
