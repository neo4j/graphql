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

import type {
    Directive,
    InputTypeComposer,
    InputTypeComposerFieldConfigMap,
    InputTypeComposerFieldConfigMapDefinition,
    SchemaComposer,
} from "graphql-compose";
import { RelationshipNestedOperationsOption } from "../../constants";
import { ConcreteEntityAdapter } from "../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import { InterfaceEntityAdapter } from "../../schema-model/entity/model-adapters/InterfaceEntityAdapter";
import { UnionEntityAdapter } from "../../schema-model/entity/model-adapters/UnionEntityAdapter";
import type { RelationshipAdapter } from "../../schema-model/relationship/model-adapters/RelationshipAdapter";
import type { RelationshipDeclarationAdapter } from "../../schema-model/relationship/model-adapters/RelationshipDeclarationAdapter";
import type { Neo4jFeaturesSettings } from "../../types";
import { withConnectionWhereInputType } from "./connection-where-input";
import { relationshipTargetHasRelationshipWithNestedOperation } from "./utils";

export function withDisconnectInputType({
    entityAdapter,
    composer,
}: {
    entityAdapter: InterfaceEntityAdapter | ConcreteEntityAdapter;
    composer: SchemaComposer;
}): InputTypeComposer | undefined {
    if (entityAdapter instanceof ConcreteEntityAdapter) {
        return composer.getOrCreateITC(entityAdapter.operations.updateMutationArgumentNames.disconnect);
    }

    return composer.getOrCreateITC(entityAdapter.operations.updateMutationArgumentNames.disconnect);
}
export function augmentDisconnectInputTypeWithDisconnectFieldInput({
    relationshipAdapter,
    composer,
    deprecatedDirectives,
    features,
}: {
    relationshipAdapter: RelationshipAdapter | RelationshipDeclarationAdapter;
    composer: SchemaComposer;
    deprecatedDirectives: Directive[];
    features: Neo4jFeaturesSettings | undefined;
}) {
    if (relationshipAdapter.source instanceof UnionEntityAdapter) {
        throw new Error("Unexpected union source");
    }
    const disconnectFieldInput = makeDisconnectInputType({
        relationshipAdapter,
        composer,
        deprecatedDirectives,
        features,
    });
    if (!disconnectFieldInput) {
        return;
    }
    const disconnectInput = withDisconnectInputType({
        entityAdapter: relationshipAdapter.source,
        composer,
    });
    if (!disconnectInput) {
        return;
    }
    const relationshipField = makeDisconnectInputTypeRelationshipField({
        relationshipAdapter,
        disconnectFieldInput,
        deprecatedDirectives,
    });
    disconnectInput.addFields(relationshipField);
}

function makeDisconnectInputType({
    relationshipAdapter,
    composer,
    deprecatedDirectives,
    features,
}: {
    relationshipAdapter: RelationshipAdapter | RelationshipDeclarationAdapter;
    composer: SchemaComposer;
    deprecatedDirectives: Directive[];
    features: Neo4jFeaturesSettings | undefined;
}): InputTypeComposer | undefined {
    if (relationshipAdapter.target instanceof UnionEntityAdapter) {
        return withUnionDisconnectInputType({ relationshipAdapter, composer, deprecatedDirectives, features });
    }
    return withDisconnectFieldInputType({ relationshipAdapter, composer, features });
}
function makeDisconnectInputTypeRelationshipField({
    relationshipAdapter,
    disconnectFieldInput,
    deprecatedDirectives,
}: {
    relationshipAdapter: RelationshipAdapter | RelationshipDeclarationAdapter;
    disconnectFieldInput: InputTypeComposer;
    deprecatedDirectives: Directive[];
}): InputTypeComposerFieldConfigMap {
    if (relationshipAdapter.target instanceof UnionEntityAdapter) {
        return {
            [relationshipAdapter.name]: {
                type: disconnectFieldInput,
                directives: deprecatedDirectives,
            },
        };
    }
    return {
        [relationshipAdapter.name]: {
            type: relationshipAdapter.isList ? disconnectFieldInput.NonNull.List : disconnectFieldInput,
            directives: deprecatedDirectives,
        },
    };
}

function withUnionDisconnectInputType({
    relationshipAdapter,
    composer,
    deprecatedDirectives,
    features,
}: {
    relationshipAdapter: RelationshipAdapter | RelationshipDeclarationAdapter;
    composer: SchemaComposer;
    deprecatedDirectives: Directive[];
    features: Neo4jFeaturesSettings | undefined;
}): InputTypeComposer | undefined {
    const typeName = relationshipAdapter.operations.unionDisconnectInputTypeName;
    if (!relationshipAdapter.nestedOperations.has(RelationshipNestedOperationsOption.DISCONNECT)) {
        return;
    }
    if (composer.has(typeName)) {
        return composer.getITC(typeName);
    }
    const fields = makeUnionDisconnectInputTypeFields({
        relationshipAdapter,
        composer,
        deprecatedDirectives,
        features,
    });
    if (!Object.keys(fields).length) {
        return;
    }
    const disconnectInput = composer.createInputTC({
        name: typeName,
        fields,
    });

    return disconnectInput;
}
function makeUnionDisconnectInputTypeFields({
    relationshipAdapter,
    composer,
    deprecatedDirectives,
    features,
}: {
    relationshipAdapter: RelationshipAdapter | RelationshipDeclarationAdapter;
    composer: SchemaComposer;
    deprecatedDirectives: Directive[];
    features: Neo4jFeaturesSettings | undefined;
}): InputTypeComposerFieldConfigMapDefinition {
    const fields: InputTypeComposerFieldConfigMapDefinition = {};
    if (!(relationshipAdapter.target instanceof UnionEntityAdapter)) {
        throw new Error("Expected union target");
    }
    for (const memberEntity of relationshipAdapter.target.concreteEntities) {
        const fieldInput = withDisconnectFieldInputType({
            relationshipAdapter,
            ifUnionMemberEntity: memberEntity,
            composer,
            features,
        });
        if (fieldInput) {
            fields[memberEntity.name] = {
                type: relationshipAdapter.isList ? fieldInput.NonNull.List : fieldInput,
                directives: deprecatedDirectives,
            };
        }
    }
    return fields;
}

export function withDisconnectFieldInputType({
    relationshipAdapter,
    composer,
    ifUnionMemberEntity,
    features,
}: {
    relationshipAdapter: RelationshipAdapter | RelationshipDeclarationAdapter;
    composer: SchemaComposer;
    ifUnionMemberEntity?: ConcreteEntityAdapter;
    features: Neo4jFeaturesSettings | undefined;
}): InputTypeComposer | undefined {
    const typeName = relationshipAdapter.operations.getDisconnectFieldInputTypeName(ifUnionMemberEntity);
    if (!relationshipAdapter.nestedOperations.has(RelationshipNestedOperationsOption.DISCONNECT)) {
        return;
    }
    if (composer.has(typeName)) {
        return composer.getITC(typeName);
    }
    const disconnectFieldInput = composer.createInputTC({
        name: typeName,
        fields: makeDisconnectFieldInputTypeFields({ relationshipAdapter, composer, ifUnionMemberEntity, features }),
    });
    return disconnectFieldInput;
}
function makeDisconnectFieldInputTypeFields({
    relationshipAdapter,
    composer,
    ifUnionMemberEntity,
    features,
}: {
    relationshipAdapter: RelationshipAdapter | RelationshipDeclarationAdapter;
    composer: SchemaComposer;
    ifUnionMemberEntity?: ConcreteEntityAdapter;
    features: Neo4jFeaturesSettings | undefined;
}): InputTypeComposerFieldConfigMapDefinition {
    const fields = {};
    if (relationshipAdapter.target instanceof ConcreteEntityAdapter) {
        fields["where"] = relationshipAdapter.operations.getConnectionWhereTypename();
        if (
            relationshipTargetHasRelationshipWithNestedOperation(
                relationshipAdapter.target,
                RelationshipNestedOperationsOption.DISCONNECT
            )
        ) {
            const disconnectInput = withDisconnectInputType({ entityAdapter: relationshipAdapter.target, composer });
            if (disconnectInput) {
                fields["disconnect"] = disconnectInput;
            }
        }
    } else if (relationshipAdapter.target instanceof InterfaceEntityAdapter) {
        fields["where"] = relationshipAdapter.operations.getConnectionWhereTypename();

        const disconnectTypename = relationshipAdapter.target.operations.updateMutationArgumentNames.disconnect;

        const hasNestedRelationships = relationshipAdapter.target.relationshipDeclarations.size > 0;
        if (composer.has(disconnectTypename) || hasNestedRelationships) {
            const disconnectInputType = composer.getOrCreateITC(disconnectTypename);

            fields["disconnect"] = disconnectInputType;
        }
    } else {
        if (!ifUnionMemberEntity) {
            throw new Error("Member Entity required.");
        }
        fields["where"] = withConnectionWhereInputType({
            relationshipAdapter,
            memberEntity: ifUnionMemberEntity,
            composer,
            features,
        });

        if (ifUnionMemberEntity.relationships.size) {
            const disconnectInput = withDisconnectInputType({ entityAdapter: ifUnionMemberEntity, composer });
            if (disconnectInput) {
                fields["disconnect"] = disconnectInput;
            }
        }
    }

    return fields;
}
