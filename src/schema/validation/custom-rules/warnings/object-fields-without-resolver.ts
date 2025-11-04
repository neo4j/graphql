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
import Debug from "debug";
import {
    Kind,
    type ASTVisitor,
    type DocumentNode,
    type FieldDefinitionNode,
    type ObjectTypeDefinitionNode,
} from "graphql";
import type { SDLValidationContext } from "graphql/validation/ValidationContext";
import { DEBUG_GRAPHQL } from "../../../../constants";
import { haveSharedElement } from "../../../../utils/utils";
import { getDirectiveNames } from "../utils/get-directive-names";
import { getInnerTypeName } from "../utils/utils";

const debug = Debug(DEBUG_GRAPHQL);

export const VALIDATE_OBJECT_FIELD_WARN_MSG = "Object types need a way to be resolved for field: ";

export function WarnObjectFieldsWithoutResolver({ customResolvers }: { customResolvers: Array<IResolvers> }) {
    return (context: SDLValidationContext): ASTVisitor => {
        return {
            ObjectTypeDefinition(objectType: ObjectTypeDefinitionNode) {
                const directiveNames = getDirectiveNames(objectType);
                const ignoreObjectsWithDirective = haveSharedElement(directiveNames, ["jwt"]);

                if (ignoreObjectsWithDirective) {
                    return;
                }

                for (const fieldNode of objectType.fields ?? []) {
                    const innerType = getInnerTypeName(fieldNode.type);
                    if (typeNeedsResolver(innerType, context.getDocument())) {
                        const hasResolvableDirective = fieldHasResolverDirective(fieldNode);
                        const hasCustomResolver = fieldHasCustomResolver({
                            customResolvers,
                            fieldNode,
                            objectType,
                        });

                        if (!hasResolvableDirective && !hasCustomResolver) {
                            const fieldName = fieldNode.name.value;
                            debug(`${VALIDATE_OBJECT_FIELD_WARN_MSG} ${fieldName}`);
                        }
                    }
                }
            },
        };
    };
}

function fieldHasCustomResolver({
    customResolvers,
    fieldNode,
    objectType,
}: {
    customResolvers: Array<IResolvers>;
    fieldNode: FieldDefinitionNode;
    objectType: ObjectTypeDefinitionNode;
}): boolean {
    const fieldName = fieldNode.name.value;
    const typeName = objectType.name.value;

    for (const resolver of customResolvers) {
        if (resolver[typeName]?.[fieldName]) {
            return true;
        }
    }
    return false;
}

function fieldHasResolverDirective(fieldNode: FieldDefinitionNode) {
    const directiveNames = getDirectiveNames(fieldNode);
    return haveSharedElement(directiveNames, [
        "cypher",
        "relationship",
        "declareRelationship",
        "customResolver",
        "populatedBy",
    ]);
}

function typeNeedsResolver(type: string, document: DocumentNode): boolean {
    const typeDef = document.definitions.find((def) => {
        if (def.kind === Kind.OBJECT_TYPE_DEFINITION) {
            if (def.name.value === type) {
                return true;
            }
            return false;
        }
    }) as ObjectTypeDefinitionNode | undefined;

    if (!typeDef) {
        return false;
    } else {
        return true;
    }
}
