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
import { UnionEntityAdapter } from "../../schema-model/entity/model-adapters/UnionEntityAdapter";
import type { RelationshipAdapter } from "../../schema-model/relationship/model-adapters/RelationshipAdapter";
import { createOnCreateITC2 } from "../create-relationship-fields/create-connect-or-create-field";

// TODO: refactor this
export function withConnectOrCreateFieldInputType({
    relationshipAdapter,
    composer,
    userDefinedFieldDirectives,
    ifUnionMemberEntity,
}: {
    relationshipAdapter: RelationshipAdapter;
    composer: SchemaComposer;
    userDefinedFieldDirectives: Map<string, DirectiveNode[]>;
    ifUnionMemberEntity?: ConcreteEntityAdapter;
}): InputTypeComposer | undefined {
    if (!relationshipAdapter.nestedOperations.has(RelationshipNestedOperationsOption.CONNECT_OR_CREATE)) {
        return;
    }

    let targetEntity: ConcreteEntityAdapter | undefined;
    if (relationshipAdapter.target instanceof UnionEntityAdapter) {
        if (!ifUnionMemberEntity) {
            throw new Error("Expected member entity.");
        }
        targetEntity = ifUnionMemberEntity;
    } else {
        if (!(relationshipAdapter.target instanceof ConcreteEntityAdapter)) {
            throw new Error("Expected concrete target");
        }
        targetEntity = relationshipAdapter.target;
    }
    if (
        !relationshipAdapter.shouldGenerateFieldInputType(ifUnionMemberEntity) &&
        !relationshipAdapter.shouldGenerateUpdateFieldInputType(ifUnionMemberEntity)
    ) {
        return;
    }

    const hasUniqueFields = targetEntity.uniqueFields.length > 0;
    if (hasUniqueFields !== true) {
        return;
    }

    createOnCreateITC2({
        schemaComposer: composer,
        relationshipAdapter,
        targetEntityAdapter: targetEntity,
        userDefinedFieldDirectives,
    });

    // TODO: this should live in the where-fields.ts
    composer.getOrCreateITC(targetEntity.operations.connectOrCreateWhereInputTypeName, (tc) => {
        tc.addFields((targetEntity as ConcreteEntityAdapter).operations.connectOrCreateWhereInputFieldNames);
    });

    const connectOrCreateName = relationshipAdapter.operations.getConnectOrCreateFieldInputTypeName(targetEntity);
    const connectOrCreateFieldInput = composer.getOrCreateITC(connectOrCreateName, (tc) => {
        tc.addFields(
            relationshipAdapter.operations.getConnectOrCreateInputFields(targetEntity as ConcreteEntityAdapter) || {}
        );
    });
    return connectOrCreateFieldInput;
}

export function withConnectOrCreateInputType({
    relationshipAdapter,
    composer,
    userDefinedFieldDirectives,
    deprecatedDirectives,
}: {
    relationshipAdapter: RelationshipAdapter;
    composer: SchemaComposer;
    userDefinedFieldDirectives: Map<string, DirectiveNode[]>;
    deprecatedDirectives: Directive[];
}): InputTypeComposer | undefined {
    if (relationshipAdapter.source instanceof UnionEntityAdapter) {
        throw new Error("Unexpected union source");
    }
    const typeName = relationshipAdapter.source.operations.connectOrCreateInputTypeName;
    if (composer.has(typeName)) {
        return composer.getITC(typeName);
    }

    const fieldInput = makeConnectOrCreateInputType({
        relationshipAdapter,
        composer,
        userDefinedFieldDirectives,
        deprecatedDirectives,
    });
    if (!fieldInput) {
        return;
    }

    const fields = makeConnectOrCreateInputTypeRelationshipField({
        relationshipAdapter,
        fieldInput,
        deprecatedDirectives,
    });
    const connectOrCreateInput = composer.createInputTC({ name: typeName, fields });
    return connectOrCreateInput;
}
function makeConnectOrCreateInputType({
    relationshipAdapter,
    composer,
    userDefinedFieldDirectives,
    deprecatedDirectives,
}: {
    relationshipAdapter: RelationshipAdapter;
    composer: SchemaComposer;
    userDefinedFieldDirectives: Map<string, DirectiveNode[]>;
    deprecatedDirectives: Directive[];
}): InputTypeComposer | undefined {
    if (relationshipAdapter.target instanceof UnionEntityAdapter) {
        return withRelationshipConnectOrCreateInputType({
            relationshipAdapter,
            composer,
            deprecatedDirectives,
            userDefinedFieldDirectives,
        });
    }
    return withConnectOrCreateFieldInputType({ relationshipAdapter, composer, userDefinedFieldDirectives });
}
function makeConnectOrCreateInputTypeRelationshipField({
    relationshipAdapter,
    fieldInput,
    deprecatedDirectives,
}: {
    relationshipAdapter: RelationshipAdapter;
    fieldInput: InputTypeComposer;
    deprecatedDirectives: Directive[];
}): InputTypeComposerFieldConfigMap {
    if (relationshipAdapter.target instanceof UnionEntityAdapter) {
        return {
            [relationshipAdapter.name]: {
                type: fieldInput,
                directives: deprecatedDirectives,
            },
        };
    }
    return {
        [relationshipAdapter.name]: {
            type: relationshipAdapter.isList ? fieldInput.NonNull.List : fieldInput,
            directives: deprecatedDirectives,
        },
    };
}

function withRelationshipConnectOrCreateInputType({
    relationshipAdapter,
    composer,
    userDefinedFieldDirectives,
    deprecatedDirectives,
}: {
    relationshipAdapter: RelationshipAdapter;
    composer: SchemaComposer;
    userDefinedFieldDirectives: Map<string, DirectiveNode[]>;
    deprecatedDirectives: Directive[];
}): InputTypeComposer | undefined {
    const typeName = relationshipAdapter.operations.getConnectOrCreateInputTypeName();
    if (!(relationshipAdapter.target instanceof UnionEntityAdapter)) {
        throw new Error("Expected union target");
    }
    if (composer.has(typeName)) {
        return composer.getITC(typeName);
    }
    const fields = makeUnionConnectOrCreateInputTypeFields({
        relationshipAdapter,
        composer,
        deprecatedDirectives,
        userDefinedFieldDirectives,
    });
    if (!Object.keys(fields).length) {
        return;
    }
    const connectOrCreateInput = composer.createInputTC({ name: typeName, fields });
    return connectOrCreateInput;
}
function makeUnionConnectOrCreateInputTypeFields({
    relationshipAdapter,
    composer,
    deprecatedDirectives,
    userDefinedFieldDirectives,
}: {
    relationshipAdapter: RelationshipAdapter;
    composer: SchemaComposer;
    deprecatedDirectives: Directive[];
    userDefinedFieldDirectives: Map<string, DirectiveNode[]>;
}): InputTypeComposerFieldConfigMapDefinition {
    const fields: InputTypeComposerFieldConfigMapDefinition = {};
    if (!(relationshipAdapter.target instanceof UnionEntityAdapter)) {
        throw new Error("Expected union target");
    }
    for (const memberEntity of relationshipAdapter.target.concreteEntities) {
        const fieldInput = withConnectOrCreateFieldInputType({
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
