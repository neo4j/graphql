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
import { overwrite } from "../create-relationship-fields/fields/overwrite";
import { relationshipTargetHasRelationshipWithNestedOperation, shouldAddDeprecatedFields } from "./utils";
import { withConnectWhereFieldInputType } from "./where-input";

export function withConnectInputType({
    entityAdapter,
    composer,
}: {
    entityAdapter: InterfaceEntityAdapter | ConcreteEntityAdapter;
    composer: SchemaComposer;
}): InputTypeComposer | undefined {
    if (entityAdapter instanceof ConcreteEntityAdapter) {
        return composer.getOrCreateITC(entityAdapter.operations.connectInputTypeName);
    }

    return composer.getOrCreateITC(entityAdapter.operations.connectInputTypeName);
}

export function augmentConnectInputTypeWithConnectFieldInput({
    relationshipAdapter,
    composer,
    deprecatedDirectives,
    features,
}: {
    relationshipAdapter: RelationshipAdapter | RelationshipDeclarationAdapter;
    composer: SchemaComposer;
    deprecatedDirectives: Directive[];
    features?: Neo4jFeaturesSettings;
}) {
    if (relationshipAdapter.source instanceof UnionEntityAdapter) {
        throw new Error("Unexpected union source");
    }
    const connectFieldInput = makeConnectInputType({
        relationshipAdapter,
        composer,
        deprecatedDirectives,
        features,
    });
    if (!connectFieldInput) {
        return;
    }
    const connectInput = withConnectInputType({
        entityAdapter: relationshipAdapter.source,
        composer,
    });
    if (!connectInput) {
        return;
    }
    const relationshipField = makeConnectInputTypeRelationshipField({
        relationshipAdapter,
        connectFieldInput,
        deprecatedDirectives,
    });
    connectInput.addFields(relationshipField);
}

function makeConnectInputType({
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
        return withUnionConnectInputType({ relationshipAdapter, composer, deprecatedDirectives, features });
    }
    return withConnectFieldInputType({ relationshipAdapter, composer, features });
}
function makeConnectInputTypeRelationshipField({
    relationshipAdapter,
    connectFieldInput,
    deprecatedDirectives,
}: {
    relationshipAdapter: RelationshipAdapter | RelationshipDeclarationAdapter;
    connectFieldInput: InputTypeComposer;
    deprecatedDirectives: Directive[];
}): InputTypeComposerFieldConfigMap {
    if (relationshipAdapter.target instanceof UnionEntityAdapter) {
        return {
            [relationshipAdapter.name]: {
                type: connectFieldInput,
                directives: deprecatedDirectives,
            },
        };
    }
    return {
        [relationshipAdapter.name]: {
            type: relationshipAdapter.isList ? connectFieldInput.NonNull.List : connectFieldInput,
            directives: deprecatedDirectives,
        },
    };
}

function withUnionConnectInputType({
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
    const typeName = relationshipAdapter.operations.unionConnectInputTypeName;
    if (!relationshipAdapter.nestedOperations.has(RelationshipNestedOperationsOption.CONNECT)) {
        return;
    }
    if (composer.has(typeName)) {
        return composer.getITC(typeName);
    }
    const fields = makeUnionConnectInputTypeFields({ relationshipAdapter, composer, deprecatedDirectives, features });
    if (!Object.keys(fields).length) {
        return;
    }
    const connectInput = composer.createInputTC({
        name: typeName,
        fields,
    });

    return connectInput;
}
function makeUnionConnectInputTypeFields({
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
        const fieldInput = withConnectFieldInputType({
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

export function withConnectFieldInputType({
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
    const typeName = relationshipAdapter.operations.getConnectFieldInputTypeName(ifUnionMemberEntity);
    if (!relationshipAdapter.nestedOperations.has(RelationshipNestedOperationsOption.CONNECT)) {
        return;
    }
    if (composer.has(typeName)) {
        return composer.getITC(typeName);
    }

    const connectFieldInput = composer.createInputTC({
        name: typeName,
        fields: makeConnectFieldInputTypeFields({ relationshipAdapter, composer, ifUnionMemberEntity, features }),
    });
    return connectFieldInput;
}
function makeConnectFieldInputTypeFields({
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
    if (relationshipAdapter.hasCreateInputFields) {
        fields["edge"] = relationshipAdapter.operations.edgeCreateInputTypeName;
    }
    if (relationshipAdapter.target instanceof ConcreteEntityAdapter) {
        fields["where"] = withConnectWhereFieldInputType(relationshipAdapter.target, composer);
        if (shouldAddDeprecatedFields(features, "overwriteArgument")) {
            fields["overwrite"] = overwrite;
        }
        if (
            relationshipTargetHasRelationshipWithNestedOperation(
                relationshipAdapter.target,
                RelationshipNestedOperationsOption.CONNECT
            )
        ) {
            const connectInput = withConnectInputType({ entityAdapter: relationshipAdapter.target, composer });
            if (connectInput) {
                fields["connect"] = relationshipAdapter.isList ? connectInput.NonNull.List : connectInput;
            }
        }
    } else if (relationshipAdapter.target instanceof InterfaceEntityAdapter) {
        fields["where"] = withConnectWhereFieldInputType(relationshipAdapter.target, composer);
        const connectTypename = relationshipAdapter.target.operations.connectInputTypeName;

        const hasNestedRelationships = relationshipAdapter.target.relationshipDeclarations.size > 0;
        if (composer.has(connectTypename) || hasNestedRelationships) {
            const connectInputType = composer.getOrCreateITC(connectTypename);
            fields["connect"] = connectInputType;
        }
    } else {
        if (!ifUnionMemberEntity) {
            throw new Error("Member Entity required.");
        }
        fields["where"] = withConnectWhereFieldInputType(ifUnionMemberEntity, composer);
        if (ifUnionMemberEntity.relationships.size) {
            const connectInputType = withConnectInputType({ entityAdapter: ifUnionMemberEntity, composer });
            if (connectInputType) {
                fields["connect"] = relationshipAdapter.isList ? connectInputType.NonNull.List : connectInputType;
            }
        }
    }

    return fields;
}
