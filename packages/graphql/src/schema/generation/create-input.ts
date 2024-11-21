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

import type { DirectiveNode } from "graphql";
import type {
    Directive,
    InputTypeComposer,
    InputTypeComposerFieldConfigMapDefinition,
    SchemaComposer,
} from "graphql-compose";
import { ConcreteEntityAdapter } from "../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import { InterfaceEntityAdapter } from "../../schema-model/entity/model-adapters/InterfaceEntityAdapter";
import { UnionEntityAdapter } from "../../schema-model/entity/model-adapters/UnionEntityAdapter";
import { RelationshipAdapter } from "../../schema-model/relationship/model-adapters/RelationshipAdapter";
import type { RelationshipDeclarationAdapter } from "../../schema-model/relationship/model-adapters/RelationshipDeclarationAdapter";
import type { Neo4jFeaturesSettings } from "../../types";
import { concreteEntityToCreateInputFields } from "../to-compose";
import { withConnectFieldInputType } from "./connect-input";
import { withCreateFieldInputType } from "./relation-input";

export function withCreateInputType({
    entityAdapter,
    userDefinedFieldDirectives,
    composer,
}: {
    entityAdapter:
        | ConcreteEntityAdapter
        | InterfaceEntityAdapter
        | RelationshipAdapter
        | RelationshipDeclarationAdapter;
    userDefinedFieldDirectives: Map<string, DirectiveNode[]>;
    composer: SchemaComposer;
}): InputTypeComposer {
    if (composer.has(entityAdapter.operations.createInputTypeName)) {
        return composer.getITC(entityAdapter.operations.createInputTypeName);
    }
    const createInputType = composer.createInputTC({
        name: entityAdapter.operations.createInputTypeName,
        fields: {},
    });

    if (entityAdapter instanceof ConcreteEntityAdapter || entityAdapter instanceof RelationshipAdapter) {
        createInputType.addFields(
            concreteEntityToCreateInputFields(entityAdapter.createInputFields, userDefinedFieldDirectives)
        );
    } else {
        createInputType.addFields(makeCreateInputFields(entityAdapter));
    }

    // ensureNonEmptyInput(composer, createInputType); - not for relationshipAdapter
    return createInputType;
}

function makeCreateInputFields(
    wrapperEntity: InterfaceEntityAdapter | RelationshipDeclarationAdapter
): InputTypeComposerFieldConfigMapDefinition {
    const wrappedEntities =
        wrapperEntity instanceof InterfaceEntityAdapter
            ? wrapperEntity.concreteEntities
            : wrapperEntity.relationshipImplementations;
    const fields: InputTypeComposerFieldConfigMapDefinition = {};
    for (const entityAdapter of wrappedEntities) {
        fields[entityAdapter.name] = {
            type: entityAdapter.operations.createInputTypeName,
        };
    }
    return fields;
}

export function augmentCreateInputTypeWithRelationshipsInput({
    relationshipAdapter,
    composer,
    userDefinedFieldDirectives,
    deprecatedDirectives,
    features,
}: {
    relationshipAdapter: RelationshipAdapter | RelationshipDeclarationAdapter;
    composer: SchemaComposer;
    userDefinedFieldDirectives: Map<string, DirectiveNode[]>;
    deprecatedDirectives: Directive[];
    features?: Neo4jFeaturesSettings;
}) {
    if (!relationshipAdapter.isCreatable()) {
        return;
    }
    if (relationshipAdapter.source instanceof InterfaceEntityAdapter) {
        // Interface CreateInput does not require relationship input fields
        // These are specified on the concrete nodes.
        return;
    }

    const relationshipsInput = makeRelationshipsInputType({
        relationshipAdapter,
        composer,
        deprecatedDirectives,
        userDefinedFieldDirectives,
        features,
    });
    if (!relationshipsInput) {
        return;
    }
    const createInput = withCreateInputType({
        entityAdapter: relationshipAdapter.source as ConcreteEntityAdapter,
        userDefinedFieldDirectives,
        composer,
    });

    if (!createInput) {
        return;
    }
    createInput.addFields({
        [relationshipAdapter.name]: {
            type: relationshipsInput,
            directives: deprecatedDirectives,
        },
    });
}

function makeRelationshipsInputType({
    relationshipAdapter,
    composer,
    userDefinedFieldDirectives,
    deprecatedDirectives,
    features,
}: {
    relationshipAdapter: RelationshipAdapter | RelationshipDeclarationAdapter;
    composer: SchemaComposer;
    userDefinedFieldDirectives: Map<string, DirectiveNode[]>;
    deprecatedDirectives: Directive[];
    features?: Neo4jFeaturesSettings;
}): InputTypeComposer | undefined {
    if (relationshipAdapter.target instanceof UnionEntityAdapter) {
        return withUnionCreateInputType({
            relationshipAdapter,
            composer,
            deprecatedDirectives,
            userDefinedFieldDirectives,
            features,
        });
    } else {
        return withFieldInputType({ relationshipAdapter, composer, userDefinedFieldDirectives });
    }
}

function withUnionCreateInputType({
    relationshipAdapter,
    composer,
    deprecatedDirectives,
    userDefinedFieldDirectives,
    features,
}: {
    relationshipAdapter: RelationshipAdapter | RelationshipDeclarationAdapter;
    composer: SchemaComposer;
    deprecatedDirectives: Directive[];
    userDefinedFieldDirectives: Map<string, DirectiveNode[]>;
    features?: Neo4jFeaturesSettings;
}): InputTypeComposer | undefined {
    const typeName = relationshipAdapter.operations.unionCreateInputTypeName;
    if (composer.has(typeName)) {
        return composer.getITC(typeName);
    }
    const fields = makeUnionCreateInputTypeFields({
        relationshipAdapter,
        composer,
        deprecatedDirectives,
        userDefinedFieldDirectives,
        features,
    });
    if (!Object.keys(fields).length) {
        return;
    }
    const createInput = composer.createInputTC({
        name: typeName,
        fields,
    });
    return createInput;
}

function makeUnionCreateInputTypeFields({
    relationshipAdapter,
    composer,
    deprecatedDirectives,
    userDefinedFieldDirectives,
}: {
    relationshipAdapter: RelationshipAdapter | RelationshipDeclarationAdapter;
    composer: SchemaComposer;
    deprecatedDirectives: Directive[];
    userDefinedFieldDirectives: Map<string, DirectiveNode[]>;
    features?: Neo4jFeaturesSettings;
}): InputTypeComposerFieldConfigMapDefinition {
    const fields: InputTypeComposerFieldConfigMapDefinition = {};
    if (!(relationshipAdapter.target instanceof UnionEntityAdapter)) {
        throw new Error("Expected union target");
    }
    for (const memberEntity of relationshipAdapter.target.concreteEntities) {
        const fieldInput = withFieldInputType({
            relationshipAdapter,
            ifUnionMemberEntity: memberEntity,
            composer,
            userDefinedFieldDirectives,
        });
        if (fieldInput) {
            fields[memberEntity.name] = {
                type: fieldInput,
                directives: deprecatedDirectives,
            };
        }
    }
    return fields;
}

export function withFieldInputType({
    relationshipAdapter,
    composer,
    userDefinedFieldDirectives,
    ifUnionMemberEntity,
}: {
    relationshipAdapter: RelationshipAdapter | RelationshipDeclarationAdapter;
    composer: SchemaComposer;
    userDefinedFieldDirectives: Map<string, DirectiveNode[]>;
    ifUnionMemberEntity?: ConcreteEntityAdapter;
}): InputTypeComposer | undefined {
    const typeName = relationshipAdapter.operations.getFieldInputTypeName(ifUnionMemberEntity);
    if (composer.has(typeName)) {
        return composer.getITC(typeName);
    }
    if (!relationshipAdapter.shouldGenerateFieldInputType(ifUnionMemberEntity)) {
        return;
    }
    const fields = makeFieldInputTypeFields({
        relationshipAdapter,
        composer,
        userDefinedFieldDirectives,
        ifUnionMemberEntity,
    });
    if (!Object.keys(fields).length) {
        return;
    }
    const fieldInput = composer.createInputTC({
        name: typeName,
        fields,
    });
    return fieldInput;
}

function makeFieldInputTypeFields({
    relationshipAdapter,
    composer,
    userDefinedFieldDirectives,
    ifUnionMemberEntity,
}: {
    relationshipAdapter: RelationshipAdapter | RelationshipDeclarationAdapter;
    composer: SchemaComposer;
    userDefinedFieldDirectives: Map<string, DirectiveNode[]>;
    ifUnionMemberEntity?: ConcreteEntityAdapter;
}): InputTypeComposerFieldConfigMapDefinition {
    const fields = {};

    const connectFieldInputType = withConnectFieldInputType({ relationshipAdapter, ifUnionMemberEntity, composer });
    if (connectFieldInputType) {
        fields["connect"] = {
            type: relationshipAdapter.isList ? connectFieldInputType.NonNull.List : connectFieldInputType,
            directives: [],
        };
    }
    const createFieldInputType = withCreateFieldInputType({
        relationshipAdapter,
        ifUnionMemberEntity,
        composer,
        userDefinedFieldDirectives,
    });
    if (createFieldInputType) {
        fields["create"] = {
            type: relationshipAdapter.isList ? createFieldInputType.NonNull.List : createFieldInputType,
            directives: [],
        };
    }
    return fields;
}
