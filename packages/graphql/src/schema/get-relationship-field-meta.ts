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

import {
    BooleanValueNode,
    EnumTypeDefinitionNode,
    FloatValueNode,
    InterfaceTypeDefinitionNode,
    IntValueNode,
    Kind,
    ListValueNode,
    StringValueNode,
} from "graphql";
import getFieldTypeMeta from "./get-field-type-meta";
import { PrimitiveField, BaseField, DateTimeField, PointField, TimeStampOperations, CustomEnumField } from "../types";
import { RelationshipField } from "../classes/Relationship";
import parseValueNode from "./parse-value-node";

function getRelationshipFieldMeta({
    relationship,
    enums,
}: {
    relationship: InterfaceTypeDefinitionNode;
    enums: EnumTypeDefinitionNode[];
}): RelationshipField[] {
    return relationship.fields
        ?.filter((field) => !field?.directives?.some((x) => x.name.value === "private"))
        .map((field) => {
            const typeMeta = getFieldTypeMeta(field);
            const idDirective = field?.directives?.find((x) => x.name.value === "id");
            const defaultDirective = field?.directives?.find((x) => x.name.value === "default");
            const coalesceDirective = field?.directives?.find((x) => x.name.value === "coalesce");
            const timestampDirective = field?.directives?.find((x) => x.name.value === "timestamp");
            // const fieldScalar = scalars.find((x) => x.name.value === typeMeta.name);
            const fieldEnum = enums.find((x) => x.name.value === typeMeta.name);

            const baseField: BaseField = {
                fieldName: field.name.value,
                typeMeta,
                otherDirectives: (field.directives || []).filter(
                    (x) =>
                        !["id", "readonly", "writeonly", "ignore", "default", "coalesce", "timestamp"].includes(
                            x.name.value
                        )
                ),
                arguments: [...(field.arguments || [])],
                description: field.description?.value,
                readonly: field?.directives?.some((d) => d.name.value === "readonly"),
                writeonly: field?.directives?.some((d) => d.name.value === "writeonly"),
            };

            // if (fieldScalar) {
            //     if (defaultDirective) {
            //         throw new Error("@default directive can only be used on primitive type fields");
            //     }
            //     const scalarField: CustomScalarField = {
            //         ...baseField,
            //     };
            //     res.scalarFields.push(scalarField);
            // } else

            if (fieldEnum) {
                if (defaultDirective) {
                    throw new Error("@default directive can only be used on primitive type fields");
                }

                if (coalesceDirective) {
                    throw new Error("@coalesce directive can only be used on primitive type fields");
                }

                const enumField: CustomEnumField = {
                    kind: "Enum",
                    ...baseField,
                };

                return enumField;
            }

            if (field.directives?.some((d) => d.name.value === "ignore")) {
                baseField.ignored = true;
                return baseField;
            }

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

                    const timestamps = operations
                        ? (operations?.values.map((x) => parseValueNode(x)) as TimeStampOperations[])
                        : (["CREATE", "UPDATE"] as TimeStampOperations[]);

                    dateTimeField.timestamps = timestamps;
                }

                if (defaultDirective) {
                    const value = defaultDirective.arguments?.find((a) => a.name.value === "value")?.value;

                    if (Number.isNaN(Date.parse((value as StringValueNode).value))) {
                        throw new Error(
                            `Default value for ${relationship.name.value}.${dateTimeField.fieldName} is not a valid DateTime`
                        );
                    }

                    dateTimeField.defaultValue = (value as StringValueNode).value;
                }

                if (coalesceDirective) {
                    throw new Error("@coalesce is not supported by DateTime fields at this time");
                }

                return dateTimeField;
            }

            if (["Point", "CartesianPoint"].includes(typeMeta.name)) {
                if (defaultDirective) {
                    throw new Error("@default directive can only be used on primitive type fields");
                }

                if (coalesceDirective) {
                    throw new Error("@coalesce directive can only be used on primitive type fields");
                }

                const pointField: PointField = {
                    ...baseField,
                };
                return pointField;
            }
            const primitiveField: PrimitiveField = {
                ...baseField,
            };

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
            }

            if (defaultDirective) {
                const value = defaultDirective.arguments?.find((a) => a.name.value === "value")?.value;

                const checkKind = (kind: string) => {
                    if (value?.kind !== kind) {
                        throw new Error(
                            `Default value for ${relationship.name.value}.${primitiveField.fieldName} does not have matching type ${primitiveField.typeMeta.name}`
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
                            `coalesce() value for ${relationship.name.value}.${primitiveField.fieldName} does not have matching type ${primitiveField.typeMeta.name}`
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

            return primitiveField;
        }) as RelationshipField[];
}

export default getRelationshipFieldMeta;
