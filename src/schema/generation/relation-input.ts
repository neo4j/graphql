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
import { withCreateInputType } from "./create-input";

export function withRelationInputType({
    relationshipAdapter,
    composer,
    deprecatedDirectives,
    userDefinedFieldDirectives,
}: {
    relationshipAdapter: RelationshipAdapter | RelationshipDeclarationAdapter;
    composer: SchemaComposer;
    deprecatedDirectives: Directive[];
    userDefinedFieldDirectives: Map<string, DirectiveNode[]>;
}): InputTypeComposer | undefined {
    const relationshipSource = relationshipAdapter.source;
    if (relationshipSource instanceof UnionEntityAdapter) {
        throw new Error("Unexpected union source");
    }
    const createFieldInputType = makeRelationFieldInputType({
        relationshipAdapter,
        composer,
        userDefinedFieldDirectives,
        deprecatedDirectives,
    });
    if (!createFieldInputType) {
        return;
    }

    const relationInput = composer.getOrCreateITC(relationshipSource.operations.relationInputTypeName);
    const relationshipField = makeRelationInputTypeRelationshipField({
        relationshipAdapter,
        createFieldInputType,
        deprecatedDirectives,
    });
    relationInput.addFields(relationshipField);

    return relationInput;
}

function makeRelationFieldInputType({
    relationshipAdapter,
    composer,
    deprecatedDirectives,
    userDefinedFieldDirectives,
}: {
    relationshipAdapter: RelationshipAdapter | RelationshipDeclarationAdapter;
    composer: SchemaComposer;
    deprecatedDirectives: Directive[];
    userDefinedFieldDirectives: Map<string, DirectiveNode[]>;
}): InputTypeComposer | undefined {
    if (relationshipAdapter.target instanceof ConcreteEntityAdapter) {
        return withCreateFieldInputType({ relationshipAdapter, composer, userDefinedFieldDirectives });
    }
    if (relationshipAdapter.target instanceof InterfaceEntityAdapter) {
        return withCreateFieldInputType({ relationshipAdapter, composer, userDefinedFieldDirectives });
    }
    if (relationshipAdapter.target instanceof UnionEntityAdapter) {
        return withUnionCreateFieldInputType({
            relationshipAdapter,
            composer,
            deprecatedDirectives,
            userDefinedFieldDirectives,
        });
    }
}
function makeRelationInputTypeRelationshipField({
    relationshipAdapter,
    createFieldInputType,
    deprecatedDirectives,
}: {
    relationshipAdapter: RelationshipAdapter | RelationshipDeclarationAdapter;
    createFieldInputType: InputTypeComposer;
    deprecatedDirectives: Directive[];
}): InputTypeComposerFieldConfigMap {
    if (relationshipAdapter.target instanceof UnionEntityAdapter) {
        return {
            [relationshipAdapter.name]: {
                type: createFieldInputType,
                directives: deprecatedDirectives,
            },
        };
    }
    return {
        [relationshipAdapter.name]: {
            type: relationshipAdapter.isList ? createFieldInputType.NonNull.List : createFieldInputType,
            directives: deprecatedDirectives,
        },
    };
}

function withUnionCreateFieldInputType({
    relationshipAdapter,
    composer,
    deprecatedDirectives,
    userDefinedFieldDirectives,
}: {
    relationshipAdapter: RelationshipAdapter | RelationshipDeclarationAdapter;
    composer: SchemaComposer;
    deprecatedDirectives: Directive[];
    userDefinedFieldDirectives: Map<string, DirectiveNode[]>;
}): InputTypeComposer | undefined {
    const typeName = relationshipAdapter.operations.unionCreateFieldInputTypeName;
    if (!(relationshipAdapter.target instanceof UnionEntityAdapter)) {
        throw new Error("Expected union target");
    }
    if (composer.has(typeName)) {
        return composer.getITC(typeName);
    }
    const fields: InputTypeComposerFieldConfigMapDefinition = makeUnionCreateFieldInputTypeFields({
        relationshipAdapter,
        composer,
        deprecatedDirectives,
        userDefinedFieldDirectives,
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
function makeUnionCreateFieldInputTypeFields({
    relationshipAdapter,
    composer,
    deprecatedDirectives,
    userDefinedFieldDirectives,
}: {
    relationshipAdapter: RelationshipAdapter | RelationshipDeclarationAdapter;
    composer: SchemaComposer;
    deprecatedDirectives: Directive[];
    userDefinedFieldDirectives: Map<string, DirectiveNode[]>;
}): InputTypeComposerFieldConfigMapDefinition {
    const fields: InputTypeComposerFieldConfigMapDefinition = {};
    if (!(relationshipAdapter.target instanceof UnionEntityAdapter)) {
        throw new Error("Expected union target");
    }
    for (const memberEntity of relationshipAdapter.target.concreteEntities) {
        const fieldInput = withCreateFieldInputType({
            relationshipAdapter,
            ifUnionMemberEntity: memberEntity,
            composer,
            userDefinedFieldDirectives,
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

export function withCreateFieldInputType({
    relationshipAdapter,
    composer,
    ifUnionMemberEntity,
    userDefinedFieldDirectives,
}: {
    relationshipAdapter: RelationshipAdapter | RelationshipDeclarationAdapter;
    composer: SchemaComposer;
    ifUnionMemberEntity?: ConcreteEntityAdapter;
    userDefinedFieldDirectives: Map<string, DirectiveNode[]>;
}): InputTypeComposer | undefined {
    const createName = relationshipAdapter.operations.getCreateFieldInputTypeName(ifUnionMemberEntity);
    if (!relationshipAdapter.nestedOperations.has(RelationshipNestedOperationsOption.CREATE)) {
        return;
    }
    if (composer.has(createName)) {
        return composer.getITC(createName);
    }
    const createFieldInput = composer.createInputTC({
        name: createName,
        fields: makeCreateFieldInputTypeFields({
            relationshipAdapter,
            composer,
            ifUnionMemberEntity,
            userDefinedFieldDirectives,
        }),
    });
    return createFieldInput;
}
function makeCreateFieldInputTypeFields({
    relationshipAdapter,
    composer,
    ifUnionMemberEntity,
    userDefinedFieldDirectives,
}: {
    relationshipAdapter: RelationshipAdapter | RelationshipDeclarationAdapter;
    composer: SchemaComposer;
    ifUnionMemberEntity?: ConcreteEntityAdapter;
    userDefinedFieldDirectives: Map<string, DirectiveNode[]>;
}): InputTypeComposerFieldConfigMapDefinition {
    const fields = {};
    if (relationshipAdapter.hasCreateInputFields) {
        fields["edge"] = relationshipAdapter.operations.edgeCreateInputTypeName;
    }
    if (relationshipAdapter.target instanceof ConcreteEntityAdapter) {
        // tODO: fix deprecatedDirectives and use the reference here instead of string
        fields["node"] = `${relationshipAdapter.target.operations.createInputTypeName}!`;
    } else if (relationshipAdapter.target instanceof InterfaceEntityAdapter) {
        const createInput = withCreateInputType({
            entityAdapter: relationshipAdapter.target,
            userDefinedFieldDirectives,
            composer,
        });
        if (createInput) {
            fields["node"] = createInput.NonNull;
        }
    } else {
        if (!ifUnionMemberEntity) {
            throw new Error("Member Entity required.");
        }
        const createInput = withCreateInputType({
            entityAdapter: ifUnionMemberEntity,
            userDefinedFieldDirectives,
            composer,
        });
        if (createInput) {
            fields["node"] = createInput.NonNull;
        }
    }

    return fields;
}
