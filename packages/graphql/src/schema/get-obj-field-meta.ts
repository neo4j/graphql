import {
    EnumTypeDefinitionNode,
    InterfaceTypeDefinitionNode,
    ListValueNode,
    ObjectTypeDefinitionNode,
    ScalarTypeDefinitionNode,
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
            const privateField = field?.directives?.find((x) => x.name.value === "private");
            if (privateField) {
                return res;
            }

            const relationshipMeta = getRelationshipMeta(field);
            const cypherMeta = getCypherMeta(field);
            const typeMeta = getFieldTypeMeta(field);
            const authDirective = field.directives?.find((x) => x.name.value === "auth");
            const autogenerateDirective = field?.directives?.find((x) => x.name.value === "autogenerate");
            const fieldInterface = interfaces.find((x) => x.name.value === typeMeta.name);
            const fieldUnion = unions.find((x) => x.name.value === typeMeta.name);
            const fieldScalar = scalars.find((x) => x.name.value === typeMeta.name);
            const fieldEnum = enums.find((x) => x.name.value === typeMeta.name);
            const fieldObject = objects.find((x) => x.name.value === typeMeta.name);

            const baseField: BaseField = {
                fieldName: field.name.value,
                typeMeta,
                otherDirectives: (field.directives || []).filter(
                    (x) => !["relationship", "cypher", "autogenerate", "auth"].includes(x.name.value)
                ),
                arguments: [...(field.arguments || [])],
                ...(authDirective ? { auth: getAuth(authDirective) } : {}),
                description: field.description?.value,
            };

            if (relationshipMeta) {
                if (fieldInterface) {
                    throw new Error("cannot have interface on relationship");
                }

                if (authDirective) {
                    throw new Error("cannot have auth directive on a relationship");
                }

                const relationField: RelationField = {
                    ...baseField,
                    ...relationshipMeta,
                };

                if (fieldUnion) {
                    const nodes: string[] = [];

                    fieldUnion.types?.forEach((type) => {
                        const node = objects.find((x) => x.name.value === type.name.value);
                        if (!node) {
                            throw new Error(`relationship union type ${type.name.value} must be an object type`);
                        }

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
                const cypherField: CypherField = {
                    ...baseField,
                    ...cypherMeta,
                };
                res.cypherFields.push(cypherField);
            } else if (fieldScalar) {
                const scalarField: CustomScalarField = {
                    ...baseField,
                };
                res.scalarFields.push(scalarField);
            } else if (fieldEnum) {
                const enumField: CustomEnumField = {
                    ...baseField,
                };
                res.enumFields.push(enumField);
            } else if (fieldUnion) {
                const unionField: UnionField = {
                    ...baseField,
                };
                res.unionFields.push(unionField);
            } else if (fieldInterface) {
                const interfaceField: InterfaceField = {
                    ...baseField,
                };
                res.interfaceFields.push(interfaceField);
            } else if (fieldObject) {
                const objectField: ObjectField = {
                    ...baseField,
                };
                res.objectFields.push(objectField);
            } else {
                // eslint-disable-next-line no-lonely-if
                if (typeMeta.name === "DateTime") {
                    const dateTimeField: DateTimeField = {
                        ...baseField,
                    };

                    if (autogenerateDirective) {
                        if (baseField.typeMeta.array) {
                            throw new Error("cannot auto-generate an array");
                        }

                        const operations = autogenerateDirective.arguments?.find((x) => x.name.value === "operations");

                        if (!operations) {
                            throw new Error(`@autogenerate operations required`);
                        }

                        if (operations.value.kind !== "ListValue") {
                            throw new Error(`@autogenerate operations must be an array`);
                        }

                        const timestamps = (operations.value as ListValueNode).values.map((x) =>
                            parseValueNode(x)
                        ) as TimeStampOperations[];

                        const allowedOperations: TimeStampOperations[] = ["create", "update"];
                        timestamps.forEach((op: TimeStampOperations, i) => {
                            if (!allowedOperations.includes(op)) {
                                throw new Error(`@autogenerate operations[${i}] invalid`);
                            }
                        });

                        dateTimeField.timestamps = timestamps;
                    }

                    res.dateTimeFields.push(dateTimeField);
                } else if (["Point", "CartesianPoint"].includes(typeMeta.name)) {
                    const pointField: PointField = {
                        ...baseField,
                    };
                    res.pointFields.push(pointField);
                } else {
                    const primitiveField: PrimitiveField = {
                        ...baseField,
                    };

                    if (autogenerateDirective) {
                        if (baseField.typeMeta.name !== "ID") {
                            throw new Error("cannot auto-generate a non ID field");
                        }

                        if (baseField.typeMeta.array) {
                            throw new Error("cannot auto-generate an array");
                        }

                        primitiveField.autogenerate = true;
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
        }
    ) as ObjectFields;
}

export default getObjFieldMeta;
