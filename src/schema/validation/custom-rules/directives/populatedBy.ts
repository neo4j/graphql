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
import { Kind, type DirectiveNode, type FieldDefinitionNode } from "graphql";
import { parseValueNode } from "../../../../schema-model/parser/parse-value-node";
import type { Neo4jGraphQLCallbacks } from "../../../../types";
import { DocumentValidationError } from "../utils/document-validation-error";
import type { ObjectOrInterfaceWithExtensions } from "../utils/path-parser";
import { getInnerTypeName } from "../utils/utils";

export function verifyPopulatedBy(callbacks?: Neo4jGraphQLCallbacks) {
    return function ({
        directiveNode,
        traversedDef,
    }: {
        directiveNode: DirectiveNode;
        traversedDef: ObjectOrInterfaceWithExtensions | FieldDefinitionNode;
    }) {
        const callbackArg = directiveNode.arguments?.find((x) => x.name.value === "callback");
        if (!callbackArg) {
            // delegate to DirectiveArgumentOfCorrectType rule
            return;
        }
        if (traversedDef.kind !== Kind.FIELD_DEFINITION) {
            // delegate to KnownDirectivesRule
            return;
        }
        const callbackName = parseValueNode(callbackArg.value);
        if (!callbacks) {
            throw new DocumentValidationError(`@populatedBy.callback needs to be provided in features option.`, [
                "callback",
            ]);
        }
        if (typeof (callbacks || {})[callbackName] !== "function") {
            throw new DocumentValidationError(`@populatedBy.callback \`${callbackName}\` must be of type Function.`, [
                "callback",
            ]);
        }
        if (
            ![
                "Int",
                "Float",
                "String",
                "Boolean",
                "ID",
                "BigInt",
                "DateTime",
                "Date",
                "Time",
                "LocalDateTime",
                "LocalTime",
                "Duration",
            ].includes(getInnerTypeName(traversedDef.type))
        ) {
            throw new DocumentValidationError(
                "@populatedBy can only be used on fields of type Int, Float, String, Boolean, ID, BigInt, DateTime, Date, Time, LocalDateTime, LocalTime or Duration.",
                []
            );
        }
    };
}
