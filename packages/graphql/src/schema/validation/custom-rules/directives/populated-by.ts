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
    GraphQLBoolean,
    GraphQLFloat,
    GraphQLID,
    GraphQLInt,
    GraphQLString,
    type ASTVisitor,
    type FieldDefinitionNode,
} from "graphql";
import { populatedByDirective } from "../../../../graphql/directives";
import {
    GraphQLBigInt,
    GraphQLDate,
    GraphQLDateTime,
    GraphQLDuration,
    GraphQLLocalDateTime,
    GraphQLLocalTime,
    GraphQLTime,
} from "../../../../graphql/scalars";
import { parseValueNode } from "../../../../schema-model/parser/parse-value-node";
import type { Neo4jValidationContext } from "../../Neo4jValidationContext";
import { assertValid, createGraphQLError, DocumentValidationError } from "../utils/document-validation-error";
import { fieldIsInNodeType } from "../utils/location-helpers/is-in-node-type";
import { fieldIsInRelationshipPropertiesType } from "../utils/location-helpers/is-in-relationship-properties-type";
import { getPathToNode } from "../utils/path-parser";
import { getInnerTypeName } from "../utils/utils";

export function validatePopulatedByDirective(context: Neo4jValidationContext): ASTVisitor {
    const typeMapWithExtensions = context.typeMapWithExtensions;
    if (!typeMapWithExtensions) {
        throw new Error("No typeMapWithExtensions found in the context");
    }
    const callbacks = context.callbacks;
    return {
        FieldDefinition(fieldDefinitionNode: FieldDefinitionNode, _key, _parent, path, ancestors) {
            const appliedPopulatedByDirective = fieldDefinitionNode.directives?.find(
                (directive) => directive.name.value === populatedByDirective.name
            );
            if (!appliedPopulatedByDirective) {
                return;
            }
            const callbackArg = appliedPopulatedByDirective.arguments?.find((x) => x.name.value === "callback");
            if (!callbackArg) {
                // delegate to DirectiveArgumentOfCorrectType rule
                return;
            }
            const isValidLocation =
                fieldIsInNodeType({ path, ancestors, typeMapWithExtensions }) ||
                fieldIsInRelationshipPropertiesType({ path, ancestors, typeMapWithExtensions });

            const { isValid, errorMsg, errorPath } = assertValid(() => {
                if (!isValidLocation) {
                    throw new DocumentValidationError(
                        `Directive "${populatedByDirective.name}" must be in a type with "@node" or within the "@relationshipProperties" directive`,
                        []
                    );
                }
                const callbackName = parseValueNode(callbackArg.value);
                if (!callbacks) {
                    throw new DocumentValidationError(
                        `@${populatedByDirective.name}.callback needs to be provided in features option.`,
                        ["callback"]
                    );
                }
                if (typeof (callbacks || {})[callbackName] !== "function") {
                    throw new DocumentValidationError(
                        `@${populatedByDirective.name}.callback \`${callbackName}\` must be of type Function.`,
                        ["callback"]
                    );
                }
                if (
                    ![
                        GraphQLInt.name,
                        GraphQLFloat.name,
                        GraphQLString.name,
                        GraphQLBoolean.name,
                        GraphQLID.name,
                        GraphQLBigInt.name,
                        GraphQLDateTime.name,
                        GraphQLDate.name,
                        GraphQLTime.name,
                        GraphQLLocalDateTime.name,
                        GraphQLLocalTime.name,
                        GraphQLDuration.name,
                    ].includes(getInnerTypeName(fieldDefinitionNode.type))
                ) {
                    throw new DocumentValidationError(
                        "@populatedBy can only be used on fields of type Int, Float, String, Boolean, ID, BigInt, DateTime, Date, Time, LocalDateTime, LocalTime or Duration.",
                        []
                    );
                }
            });
            const pathToNode = getPathToNode(path, ancestors);

            if (!isValid) {
                context.reportError(
                    createGraphQLError({
                        nodes: [fieldDefinitionNode],
                        path: [...pathToNode[0], `@${populatedByDirective.name}`, ...errorPath],
                        errorMsg,
                    })
                );
            }
        },
    };
}
