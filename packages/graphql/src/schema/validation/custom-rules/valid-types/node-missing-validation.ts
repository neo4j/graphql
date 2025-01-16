// /*
//  * Copyright (c) "Neo4j"
//  * Neo4j Sweden AB [http://neo4j.com]
//  *
//  * This file is part of Neo4j.
//  *
//  * Licensed under the Apache License, Version 2.0 (the "License");
//  * you may not use this file except in compliance with the License.
//  * You may obtain a copy of the License at
//  *
//  *     http://www.apache.org/licenses/LICENSE-2.0
//  *
//  * Unless required by applicable law or agreed to in writing, software
//  * distributed under the License is distributed on an "AS IS" BASIS,
//  * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//  * See the License for the specific language governing permissions and
//  * limitations under the License.
//  */

import type { ASTVisitor, FieldDefinitionNode, ObjectTypeDefinitionNode, ObjectTypeExtensionNode } from "graphql";
import { Kind } from "graphql";
import type { SDLValidationContext } from "graphql/validation/ValidationContext";
import {
    cypherDirective,
    filterableDirective,
    fulltextDirective,
    idDirective,
    mutationDirective,
    nodeDirective,
    populatedByDirective,
    queryDirective,
    relationshipDirective,
    relayIdDirective,
    selectableDirective,
    settableDirective,
    subscriptionDirective,
    timestampDirective,
    vectorDirective,
} from "../../../../graphql/directives";
import { authenticationDirectiveScaffold } from "../../../../graphql/directives/type-dependant-directives/authentication";
import { authorizationDirectiveScaffold } from "../../../../graphql/directives/type-dependant-directives/authorization";
import { subscriptionsAuthorizationDirectiveScaffold } from "../../../../graphql/directives/type-dependant-directives/subscriptions-authorization";
import { asArray } from "../../../../utils/utils";
import { assertValid, createGraphQLError, DocumentValidationError } from "../utils/document-validation-error";
import { getPathToNode } from "../utils/path-parser";

type ObjectExtensionsTypeMap = {
    extensions: ObjectTypeExtensionNode[];
    definition: ObjectTypeDefinitionNode;
};
export function nodeMissingValidation(context: SDLValidationContext): ASTVisitor {
    const extensionsTypeMap: Record<string, ObjectExtensionsTypeMap> = context
        .getDocument()
        .definitions.reduce((acc, def): Record<string, ObjectExtensionsTypeMap> => {
            if (def.kind === Kind.OBJECT_TYPE_EXTENSION || def.kind === Kind.OBJECT_TYPE_DEFINITION) {
                const typeName = def.name.value;
                if (!acc[typeName]) {
                    acc[typeName] = { extensions: [], definition: undefined };
                }
                if (def.kind === Kind.OBJECT_TYPE_EXTENSION) {
                    if (acc[typeName].extensions) {
                        acc[typeName].extensions.push(def);
                    } else {
                        acc[typeName].extensions = [def];
                    }
                } else {
                    acc[typeName].definition = def;
                }
            }
            return acc;
        }, {});
    return {
        FieldDefinition(fieldDefinitionNode: FieldDefinitionNode, _key, _parent, path, ancestors) {
            const [_pathToNode, _traversedDef, parentOfTraversedDef] = getPathToNode(path, ancestors);
            if (!parentOfTraversedDef) {
                return;
            }
            const parentTypeAndExtensions = extensionsTypeMap[parentOfTraversedDef.name.value];
            if (!parentTypeAndExtensions) {
                return;
            }
            const allDirectives = [
                ...(parentTypeAndExtensions.definition.directives ?? []),
                ...parentTypeAndExtensions.extensions.flatMap((ext) => ext.directives ?? []),
            ];
            const nodeUsage = allDirectives?.find((directive) => directive.name.value === nodeDirective.name);
            if (nodeUsage) {
                return;
            }
            // if `@node` is not found then check that check that no directives that requires `@node` are present
            const { isValid, errorMsg } = assertValid(() => {
                const nodeRelatedDirectives = [
                    authorizationDirectiveScaffold.name,
                    authenticationDirectiveScaffold.name,
                    subscriptionsAuthorizationDirectiveScaffold.name,
                    relationshipDirective.name,
                    cypherDirective.name,
                    idDirective.name,
                    relayIdDirective.name,
                    timestampDirective.name,
                    populatedByDirective.name,
                    selectableDirective.name,
                    settableDirective.name,
                    filterableDirective.name,
                ];

                for (const directive of fieldDefinitionNode.directives ?? []) {
                    if (nodeRelatedDirectives.includes(directive.name.value)) {
                        throw new DocumentValidationError(
                            `Directive "${directive.name.value}" requires to be used within the "@node" directive`,
                            []
                        );
                    }
                }
            });

            if (!isValid) {
                context.reportError(
                    createGraphQLError({
                        nodes: [fieldDefinitionNode],
                        path,
                        errorMsg,
                    })
                );
            }

            return;
        },
        ObjectTypeDefinition(objectTypeDefinitionNode: ObjectTypeDefinitionNode) {
            const { directives } = objectTypeDefinitionNode;
            const objectTypeExtensionNodes = extensionsTypeMap[objectTypeDefinitionNode.name.value]?.extensions;

            const extensionsDirectives = asArray(objectTypeExtensionNodes).flatMap((extensionNode) => {
                return extensionNode.directives ?? [];
            });
            const allDirectives = [...(directives ?? []), ...extensionsDirectives];
            const nodeUsage = allDirectives?.find((directive) => directive.name.value === nodeDirective.name);
            if (nodeUsage) {
                return;
            }
            // if `@node` is not found then check that check that no directives that requires `@node` are present
            const nodeRelatedDirectives = [
                authorizationDirectiveScaffold.name,
                authenticationDirectiveScaffold.name,
                subscriptionsAuthorizationDirectiveScaffold.name,
                queryDirective.name,
                mutationDirective.name,
                subscriptionDirective.name,
                fulltextDirective.name,
                vectorDirective.name,
            ];

            const { isValid, errorMsg } = assertValid(() => {
                for (const directive of allDirectives ?? []) {
                    if (nodeRelatedDirectives.includes(directive.name.value)) {
                        throw new DocumentValidationError(
                            `Directive "${directive.name.value}" requires to be used within the "@node" directive`,
                            []
                        );
                    }
                }
            });

            if (!isValid) {
                context.reportError(
                    createGraphQLError({
                        nodes: [objectTypeDefinitionNode],
                        path: [objectTypeDefinitionNode.name.value],
                        errorMsg,
                    })
                );
            }
        },
    };
}
