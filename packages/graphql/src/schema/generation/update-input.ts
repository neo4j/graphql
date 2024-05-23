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
import { RelationshipAdapter } from "../../schema-model/relationship/model-adapters/RelationshipAdapter";
import type { RelationshipDeclarationAdapter } from "../../schema-model/relationship/model-adapters/RelationshipDeclarationAdapter";
import type { Neo4jFeaturesSettings } from "../../types";
import { ensureNonEmptyInput } from "../ensure-non-empty-input";
import { concreteEntityToUpdateInputFields, withArrayOperators, withMathOperators } from "../to-compose";
import { withConnectFieldInputType } from "./connect-input";
import { withConnectOrCreateFieldInputType } from "./connect-or-create-input";
import { withConnectionWhereInputType } from "./connection-where-input";
import { withDeleteFieldInputType } from "./delete-input";
import { withDisconnectFieldInputType } from "./disconnect-input";
import { withCreateFieldInputType } from "./relation-input";

export function withUpdateInputType({
    entityAdapter,
    userDefinedFieldDirectives,
    composer,
}: {
    entityAdapter: ConcreteEntityAdapter | InterfaceEntityAdapter | RelationshipAdapter;
    userDefinedFieldDirectives: Map<string, DirectiveNode[]>;
    composer: SchemaComposer;
}): InputTypeComposer {
    const inputTypeName =
        entityAdapter instanceof RelationshipAdapter
            ? entityAdapter.operations.edgeUpdateInputTypeName
            : // : entityAdapter.operations.updateMutationArgumentNames.update; TODO
              entityAdapter.operations.updateInputTypeName;
    if (composer.has(inputTypeName)) {
        return composer.getITC(inputTypeName);
    }
    const updateInputType = composer.createInputTC({
        name: inputTypeName,
        fields: {},
    });

    if (entityAdapter instanceof ConcreteEntityAdapter || entityAdapter instanceof RelationshipAdapter) {
        updateInputType.addFields(
            concreteEntityToUpdateInputFields(entityAdapter.updateInputFields, userDefinedFieldDirectives, [
                withMathOperators(),
                withArrayOperators(),
            ])
        );
    } else {
        const hasNestedRelationships = entityAdapter.relationshipDeclarations.size > 0;
        const hasFields = entityAdapter.updateInputFields.length > 0;
        if (!hasNestedRelationships && !hasFields) {
            ensureNonEmptyInput(composer, updateInputType);
        }

        updateInputType.addFields(
            concreteEntityToUpdateInputFields(entityAdapter.updateInputFields, userDefinedFieldDirectives, [
                withMathOperators(),
            ])
        );
    }
    return updateInputType;
}

export function augmentUpdateInputTypeWithUpdateFieldInput({
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
    features: Neo4jFeaturesSettings | undefined;
}) {
    if (relationshipAdapter.source instanceof UnionEntityAdapter) {
        throw new Error("Unexpected union source");
    }
    const updateFieldInput = makeUpdateInputType({
        relationshipAdapter,
        composer,
        deprecatedDirectives,
        userDefinedFieldDirectives,
        features,
    });
    if (!updateFieldInput) {
        return;
    }
    const updateInput = withUpdateInputType({
        entityAdapter: relationshipAdapter.source,
        userDefinedFieldDirectives,
        composer,
    });
    const relationshipField = makeUpdateInputTypeRelationshipField({
        relationshipAdapter,
        updateFieldInput,
        deprecatedDirectives,
    });
    updateInput.addFields(relationshipField);
}

function makeUpdateInputType({
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
    features: Neo4jFeaturesSettings | undefined;
}): InputTypeComposer | undefined {
    if (relationshipAdapter.target instanceof UnionEntityAdapter) {
        return withUnionUpdateInputType({
            relationshipAdapter,
            composer,
            deprecatedDirectives,
            userDefinedFieldDirectives,
            features,
        });
    }
    return withUpdateFieldInputType({ relationshipAdapter, composer, userDefinedFieldDirectives, features });
}
function makeUpdateInputTypeRelationshipField({
    relationshipAdapter,
    updateFieldInput,
    deprecatedDirectives,
}: {
    relationshipAdapter: RelationshipAdapter | RelationshipDeclarationAdapter;
    updateFieldInput: InputTypeComposer;
    deprecatedDirectives: Directive[];
}): InputTypeComposerFieldConfigMap {
    if (relationshipAdapter.target instanceof UnionEntityAdapter) {
        return {
            [relationshipAdapter.name]: {
                type: updateFieldInput,
                directives: deprecatedDirectives,
            },
        };
    }
    return {
        [relationshipAdapter.name]: {
            type: relationshipAdapter.isList ? updateFieldInput.NonNull.List : updateFieldInput,
            directives: deprecatedDirectives,
        },
    };
}

function withUpdateFieldInputType({
    relationshipAdapter,
    composer,
    userDefinedFieldDirectives,
    ifUnionMemberEntity,
    features,
}: {
    relationshipAdapter: RelationshipAdapter | RelationshipDeclarationAdapter;
    composer: SchemaComposer;
    userDefinedFieldDirectives: Map<string, DirectiveNode[]>;
    ifUnionMemberEntity?: ConcreteEntityAdapter;
    features: Neo4jFeaturesSettings | undefined;
}): InputTypeComposer | undefined {
    const typeName = relationshipAdapter.operations.getUpdateFieldInputTypeName(ifUnionMemberEntity);
    if (!relationshipAdapter.shouldGenerateUpdateFieldInputType(ifUnionMemberEntity)) {
        return;
    }
    if (!relationshipAdapter.isUpdatable()) {
        return;
    }
    if (composer.has(typeName)) {
        return composer.getITC(typeName);
    }
    const updateFieldInput = composer.createInputTC({
        name: typeName,
        fields: makeUpdateFieldInputTypeFields({
            relationshipAdapter,
            composer,
            userDefinedFieldDirectives,
            ifUnionMemberEntity,
            features,
        }),
    });
    return updateFieldInput;
}

function makeUpdateFieldInputTypeFields({
    relationshipAdapter,
    composer,
    userDefinedFieldDirectives,
    ifUnionMemberEntity,
    features,
}: {
    relationshipAdapter: RelationshipAdapter | RelationshipDeclarationAdapter;
    composer: SchemaComposer;
    userDefinedFieldDirectives: Map<string, DirectiveNode[]>;
    ifUnionMemberEntity?: ConcreteEntityAdapter;
    features: Neo4jFeaturesSettings | undefined;
}): InputTypeComposerFieldConfigMapDefinition {
    const fields = {};
    let connectOrCreateFieldInputType: InputTypeComposer | undefined;
    let connectionWhereInputType: InputTypeComposer | string | undefined;
    const relationshipTarget = relationshipAdapter.target;
    if (relationshipTarget instanceof ConcreteEntityAdapter) {
        connectionWhereInputType = relationshipAdapter.operations.getConnectionWhereTypename();
        connectOrCreateFieldInputType = withConnectOrCreateFieldInputType({
            relationshipAdapter,
            composer,
            userDefinedFieldDirectives,
        });
    } else if (relationshipTarget instanceof InterfaceEntityAdapter) {
        connectionWhereInputType = relationshipAdapter.operations.getConnectionWhereTypename();
    } else {
        if (!ifUnionMemberEntity) {
            throw new Error("Member Entity required.");
        }
        connectionWhereInputType = withConnectionWhereInputType({
            relationshipAdapter,
            memberEntity: ifUnionMemberEntity,
            composer,
            features,
        });
        connectOrCreateFieldInputType = withConnectOrCreateFieldInputType({
            relationshipAdapter,
            composer,
            userDefinedFieldDirectives,
            ifUnionMemberEntity,
        });
    }
    if (connectionWhereInputType) {
        fields["where"] = {
            type: connectionWhereInputType,
            directives: [],
        };
    }
    if (connectOrCreateFieldInputType) {
        fields["connectOrCreate"] = {
            type: relationshipAdapter.isList
                ? connectOrCreateFieldInputType.NonNull.List
                : connectOrCreateFieldInputType,
            directives: [],
        };
    }
    const connectFieldInputType = withConnectFieldInputType({ relationshipAdapter, ifUnionMemberEntity, composer });
    if (connectFieldInputType) {
        fields["connect"] = {
            type: relationshipAdapter.isList ? connectFieldInputType.NonNull.List : connectFieldInputType,
            directives: [],
        };
    }
    const disconnectFieldInputType = withDisconnectFieldInputType({
        relationshipAdapter,
        ifUnionMemberEntity,
        composer,
        features,
    });
    if (disconnectFieldInputType) {
        fields["disconnect"] = {
            type: relationshipAdapter.isList ? disconnectFieldInputType.NonNull.List : disconnectFieldInputType,
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
    const updateFieldInputType = withUpdateConnectionFieldInputType({
        relationshipAdapter,
        ifUnionMemberEntity,
        composer,
        userDefinedFieldDirectives,
    });
    if (updateFieldInputType) {
        fields["update"] = {
            type: updateFieldInputType,
            directives: [],
        };
    }
    const deleteFieldInputType = withDeleteFieldInputType({
        relationshipAdapter,
        ifUnionMemberEntity,
        composer,
        features,
    });
    if (deleteFieldInputType) {
        fields["delete"] = {
            type: relationshipAdapter.isList ? deleteFieldInputType.NonNull.List : deleteFieldInputType,
            directives: [],
        };
    }
    return fields;
}

function withUnionUpdateInputType({
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
    features: Neo4jFeaturesSettings | undefined;
}): InputTypeComposer | undefined {
    const typeName = relationshipAdapter.operations.unionUpdateInputTypeName;
    if (composer.has(typeName)) {
        return composer.getITC(typeName);
    }
    const fields = makeUnionUpdateInputTypeFields({
        relationshipAdapter,
        composer,
        deprecatedDirectives,
        userDefinedFieldDirectives,
        features,
    });
    if (!Object.keys(fields).length) {
        return;
    }
    const updateInput = composer.createInputTC({
        name: typeName,
        fields,
    });
    return updateInput;
}
function makeUnionUpdateInputTypeFields({
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
    features: Neo4jFeaturesSettings | undefined;
}): InputTypeComposerFieldConfigMapDefinition {
    const fields: InputTypeComposerFieldConfigMapDefinition = {};
    if (!(relationshipAdapter.target instanceof UnionEntityAdapter)) {
        throw new Error("Expected union target");
    }
    for (const memberEntity of relationshipAdapter.target.concreteEntities) {
        const fieldInput = withUpdateFieldInputType({
            relationshipAdapter,
            ifUnionMemberEntity: memberEntity,
            composer,
            userDefinedFieldDirectives,
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

function withUpdateConnectionFieldInputType({
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
    const typeName = relationshipAdapter.operations.getUpdateConnectionInputTypename(ifUnionMemberEntity);
    if (!relationshipAdapter.nestedOperations.has(RelationshipNestedOperationsOption.UPDATE)) {
        return;
    }
    if (composer.has(typeName)) {
        return composer.getITC(typeName);
    }
    const fields = makeUpdateConnectionFieldInputTypeFields({
        relationshipAdapter,
        composer,
        userDefinedFieldDirectives,
        ifUnionMemberEntity,
    });

    const updateFieldInput = composer.createInputTC({ name: typeName, fields });
    return updateFieldInput;
}
function makeUpdateConnectionFieldInputTypeFields({
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
    const fields: InputTypeComposerFieldConfigMapDefinition = {};
    if (relationshipAdapter.target instanceof UnionEntityAdapter) {
        if (!ifUnionMemberEntity) {
            throw new Error("Expected member entity");
        }
        const updateInputType = withUpdateInputType({
            entityAdapter: ifUnionMemberEntity,
            userDefinedFieldDirectives,
            composer,
        });
        fields["node"] = updateInputType;
    } else {
        // TODO: we need to fix deprecatedDirectives before we can use the reference
        // const updateInputType = withUpdateInputType({
        //     entityAdapter: relationshipAdapter.target,
        //     userDefinedFieldDirectives,
        //     composer,
        // });
        // fields["node"] = updateInputType;
        fields["node"] = relationshipAdapter.target.operations.updateInputTypeName;
    }
    if (relationshipAdapter.hasUpdateInputFields) {
        fields["edge"] = relationshipAdapter.operations.edgeUpdateInputTypeName;
    }
    return fields;
}
