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

export function withDeleteInputType({
    entityAdapter,
    composer,
}: {
    entityAdapter: InterfaceEntityAdapter | ConcreteEntityAdapter;
    composer: SchemaComposer;
}): InputTypeComposer | undefined {
    if (entityAdapter instanceof ConcreteEntityAdapter) {
        return composer.getOrCreateITC(entityAdapter.operations.updateMutationArgumentNames.delete);
    }

    return composer.getOrCreateITC(entityAdapter.operations.updateMutationArgumentNames.delete);
}

export function augmentDeleteInputTypeWithDeleteFieldInput({
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
    const deleteFieldInput = makeDeleteInputType({
        relationshipAdapter,
        composer,
        deprecatedDirectives,
        features,
    });
    if (!deleteFieldInput) {
        return;
    }
    const deleteInput = withDeleteInputType({
        entityAdapter: relationshipAdapter.source,
        composer,
    });
    if (!deleteInput) {
        return;
    }
    const relationshipField = makeDeleteInputTypeRelationshipField({
        relationshipAdapter,
        deleteFieldInput,
        deprecatedDirectives,
    });
    deleteInput.addFields(relationshipField);
}
function makeDeleteInputType({
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
        return withUnionDeleteInputType({ relationshipAdapter, composer, deprecatedDirectives, features });
    }
    return withDeleteFieldInputType({ relationshipAdapter, composer, features });
}
function makeDeleteInputTypeRelationshipField({
    relationshipAdapter,
    deleteFieldInput,
    deprecatedDirectives,
}: {
    relationshipAdapter: RelationshipAdapter | RelationshipDeclarationAdapter;
    deleteFieldInput: InputTypeComposer;
    deprecatedDirectives: Directive[];
}): InputTypeComposerFieldConfigMap {
    if (relationshipAdapter.target instanceof UnionEntityAdapter) {
        return {
            [relationshipAdapter.name]: {
                type: deleteFieldInput,
                directives: deprecatedDirectives,
            },
        };
    }
    return {
        [relationshipAdapter.name]: {
            type: relationshipAdapter.isList ? deleteFieldInput.NonNull.List : deleteFieldInput,
            directives: deprecatedDirectives,
        },
    };
}

export function withUnionDeleteInputType({
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
    const typeName = relationshipAdapter.operations.unionDeleteInputTypeName;
    if (!relationshipAdapter.nestedOperations.has(RelationshipNestedOperationsOption.DELETE)) {
        return;
    }
    if (composer.has(typeName)) {
        return composer.getITC(typeName);
    }
    const fields = makeUnionDeleteInputTypeFields({ relationshipAdapter, composer, deprecatedDirectives, features });
    if (!Object.keys(fields).length) {
        return;
    }
    const deleteInput = composer.createInputTC({
        name: typeName,
        fields,
    });

    return deleteInput;
}
function makeUnionDeleteInputTypeFields({
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
        const fieldInput = withDeleteFieldInputType({
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

export function withDeleteFieldInputType({
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
    const typeName = relationshipAdapter.operations.getDeleteFieldInputTypeName(ifUnionMemberEntity);
    if (!relationshipAdapter.nestedOperations.has(RelationshipNestedOperationsOption.DELETE)) {
        return;
    }
    if (composer.has(typeName)) {
        return composer.getITC(typeName);
    }
    const disconnectFieldInput = composer.createInputTC({
        name: typeName,
        fields: makeDeleteFieldInputTypeFields({ relationshipAdapter, composer, ifUnionMemberEntity, features }),
    });
    return disconnectFieldInput;
}
function makeDeleteFieldInputTypeFields({
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
                RelationshipNestedOperationsOption.DELETE
            )
        ) {
            const deleteInput = withDeleteInputType({ entityAdapter: relationshipAdapter.target, composer });
            if (deleteInput) {
                fields["delete"] = deleteInput;
            }
        }
    } else if (relationshipAdapter.target instanceof InterfaceEntityAdapter) {
        fields["where"] = relationshipAdapter.operations.getConnectionWhereTypename();

        const deleteTypename = relationshipAdapter.target.operations.updateMutationArgumentNames.delete;

        const hasNestedRelationships = relationshipAdapter.target.relationshipDeclarations.size > 0;
        if (composer.has(deleteTypename) || hasNestedRelationships) {
            const deleteInputType = composer.getOrCreateITC(deleteTypename);
            fields["delete"] = deleteInputType;
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
            const deleteInput = withDeleteInputType({ entityAdapter: ifUnionMemberEntity, composer });
            if (deleteInput) {
                fields["delete"] = deleteInput;
            }
        }
    }

    return fields;
}
