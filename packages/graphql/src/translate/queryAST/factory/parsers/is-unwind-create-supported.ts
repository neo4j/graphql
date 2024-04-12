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

import type { EntityAdapter } from "../../../../schema-model/entity/EntityAdapter";
import type { ConcreteEntityAdapter } from "../../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { RelationshipAdapter } from "../../../../schema-model/relationship/model-adapters/RelationshipAdapter";
import type { Neo4jGraphQLTranslationContext } from "../../../../types/neo4j-graphql-translation-context";
import { asArray } from "../../../../utils/utils";
import { assertIsConcreteEntity, isConcreteEntity } from "../../utils/is-concrete-entity";

export const UNSUPPORTED_REASON_SUBSCRIPTION = "Unwind create optimization does not yet support subscriptions";
export const UNSUPPORTED_REASON_ABSTRACT_TYPES = "Abstract types are not yet supported";
export const UNSUPPORTED_REASON_POPULATED_BY = "Annotation: populatedBy is not yet supported";
export const UNSUPPORTED_REASON_CONNECT = "Operation: connect is not yet supported";
export const UNSUPPORTED_REASON_CONNECT_OR_CREATE = "Operation: connectOrCreate is not yet supported";

type UnwindCreateSupported = {
    isSupported: boolean;
    reason: string;
};

const SUPPORTED = {
    isSupported: true,
    reason: "",
};

export function isUnwindCreateSupported(
    entityAdapter: EntityAdapter,
    createArgs: Record<string, any>[],
    context: Neo4jGraphQLTranslationContext
): UnwindCreateSupported {
    const isSubscriptionEnabled = checkSubscriptionEnabled(context);
    if (!isSubscriptionEnabled.isSupported) {
        return isSubscriptionEnabled;
    }
    const isConcreteEntity = checkIsConcreteEntity(entityAdapter);
    if (!isConcreteEntity.isSupported) {
        return isConcreteEntity;
    }
    assertIsConcreteEntity(entityAdapter);
    const unsupportedAnnotation = checkUnsupportedAnnotations(entityAdapter);
    if (!unsupportedAnnotation.isSupported) {
        return unsupportedAnnotation;
    }

    for (let createArg of createArgs) {
        if (createArg["node"]) {
            // top level path does not contains node, apart from that the parsing will be the same.
            createArg = createArg["node"];
        }
        const entries = Object.entries(createArg);
        for (const [key, value] of entries) {
            const relationship = entityAdapter.relationships.get(key);
            if (relationship) {
                const isOperationSupported = checkOperation(value);
                if (!isOperationSupported.isSupported) {
                    return isOperationSupported;
                }
                const unsupportedAnnotation = checkUnsupportedAnnotations(relationship);
                if (!unsupportedAnnotation.isSupported) {
                    return unsupportedAnnotation;
                }
                const target = relationship.target;
                const isNestedSupported = isUnwindCreateSupported(target, asArray(value.create), context);
                if (!isNestedSupported.isSupported) {
                    return isNestedSupported;
                }
            }
        }
    }
    return {
        isSupported: true,
        reason: "",
    };
}

function checkSubscriptionEnabled(context: Neo4jGraphQLTranslationContext): UnwindCreateSupported {
    if (context.subscriptionsEnabled) {
        return {
            isSupported: false,
            reason: UNSUPPORTED_REASON_SUBSCRIPTION,
        };
    }
    return SUPPORTED;
}

function checkIsConcreteEntity(entityAdapter: EntityAdapter): UnwindCreateSupported {
    if (!isConcreteEntity(entityAdapter)) {
        return {
            isSupported: false,
            reason: UNSUPPORTED_REASON_ABSTRACT_TYPES,
        };
    }
    return SUPPORTED;
}

function checkUnsupportedAnnotations(
    concreteEntity: ConcreteEntityAdapter | RelationshipAdapter
): UnwindCreateSupported {
    for (const attribute of concreteEntity.attributes.values()) {
        if (attribute.annotations.populatedBy && attribute.annotations.populatedBy.operations.includes("CREATE")) {
            return {
                isSupported: false,
                reason: UNSUPPORTED_REASON_POPULATED_BY,
            };
        }
    }
    return SUPPORTED;
}

function checkOperation(args: Record<string, any>): UnwindCreateSupported {
    if (args.connect) {
        return {
            isSupported: false,
            reason: UNSUPPORTED_REASON_CONNECT,
        };
    }

    if (args.connectOrCreate) {
        return {
            isSupported: false,
            reason: UNSUPPORTED_REASON_CONNECT_OR_CREATE,
        };
    }
    return SUPPORTED;
}
