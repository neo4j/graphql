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

import type { ASTVisitor, FieldDefinitionNode, StringValueNode } from "graphql";
import type { SDLValidationContext } from "graphql/validation/ValidationContext";
import { isSpatial, isTemporal } from "../../../constants";
import { defaultDirective } from "../../../graphql/directives";
import {
    GraphQLBuiltInScalarType,
    Neo4jGraphQLNumberType,
    Neo4jGraphQLSpatialType,
    Neo4jGraphQLTemporalType,
} from "../../../schema-model/attribute/AttributeType";
import {
    assertValid,
    createGraphQLError,
    DocumentValidationError,
} from "../../../schema/validation/custom-rules/utils/document-validation-error";
import { getPathToNode } from "../../../schema/validation/custom-rules/utils/path-parser";
import { assertArgumentHasSameTypeAsField } from "../../../schema/validation/custom-rules/utils/same-type-argument-as-field";
import { getInnerTypeName, isArrayType } from "../../../schema/validation/custom-rules/utils/utils";

export function ValidDefault(context: SDLValidationContext): ASTVisitor {
    return {
        FieldDefinition(fieldDefinitionNode: FieldDefinitionNode, _key, _parent, path, ancestors) {
            const { directives } = fieldDefinitionNode;
            if (!directives) {
                return;
            }
            const defaultDirectiveNode = directives.find((directive) => directive.name.value === defaultDirective.name);

            if (!defaultDirectiveNode || !defaultDirectiveNode.arguments) {
                return;
            }
            const defaultValue = defaultDirectiveNode.arguments.find((a) => a.name.value === "value");
            if (!defaultValue) {
                return;
            }
            const expectedType = getInnerTypeName(fieldDefinitionNode.type);
            const { isValid, errorMsg, errorPath } = assertValid(() => {
                if (!isArrayType(fieldDefinitionNode)) {
                    if (isSpatial(expectedType)) {
                        throw new DocumentValidationError(`@default is not supported by Spatial types.`, ["value"]);
                    } else if (isTemporal(expectedType)) {
                        if (Number.isNaN(Date.parse((defaultValue?.value as StringValueNode).value))) {
                            throw new DocumentValidationError(
                                `@default.${defaultValue.name.value} is not a valid ${expectedType}`,
                                ["value"]
                            );
                        }
                    } else if (!isTypeABuiltInType(expectedType)) {
                        //TODO: Add check for user defined enums that are currently not implemented
                        throw new DocumentValidationError(
                            `@default directive can only be used on Temporal types and types: Int | Float | String | Boolean | ID | Enum`,
                            []
                        );
                    }
                }
                assertArgumentHasSameTypeAsField({
                    directiveName: "@default",
                    traversedDef: fieldDefinitionNode,
                    argument: defaultValue,
                    enums: [],
                });
            });
            const [pathToNode] = getPathToNode(path, ancestors);
            if (!isValid) {
                context.reportError(
                    createGraphQLError({
                        nodes: [fieldDefinitionNode],
                        path: [...pathToNode, fieldDefinitionNode.name.value, ...errorPath],
                        errorMsg,
                    })
                );
            }
        },
    };
}

export function isTypeABuiltInType(expectedType: string): boolean {
    return [GraphQLBuiltInScalarType, Neo4jGraphQLNumberType, Neo4jGraphQLSpatialType, Neo4jGraphQLTemporalType].some(
        (enumValue) => enumValue[expectedType] === expectedType
    );
}
