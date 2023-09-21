import type { Directive, InputTypeComposer, SchemaComposer } from "graphql-compose";
import { RelationshipNestedOperationsOption } from "../../constants";
import { ConcreteEntityAdapter } from "../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { InterfaceEntityAdapter } from "../../schema-model/entity/model-adapters/InterfaceEntityAdapter";
import { UnionEntityAdapter } from "../../schema-model/entity/model-adapters/UnionEntityAdapter";
import { RelationshipAdapter } from "../../schema-model/relationship/model-adapters/RelationshipAdapter";
import { withDeleteFieldInputType, withDeleteFieldInputTypeI, withDeleteFieldInputTypeU } from "./create-input";
import { makeImplementationsDeleteInput } from "./implementation-inputs";

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
    const implementationsUpdateInputType = makeImplementationsDeleteInput({
        interfaceEntityAdapter: entityAdapter,
        composer,
    });

    if (!implementationsUpdateInputType) {
        return undefined;
    }

    const deleteInputType = composer.getOrCreateITC(entityAdapter.operations.updateMutationArgumentNames.delete);
    deleteInputType.setField("_on", implementationsUpdateInputType);
    return deleteInputType;
}

export function augmentDeleteInputTypeWithDeleteFieldInput({
    relationshipAdapter,
    composer,
    deprecatedDirectives,
}: {
    relationshipAdapter: RelationshipAdapter;
    composer: SchemaComposer;
    deprecatedDirectives: Directive[];
}) {
    let deleteFieldInput: InputTypeComposer | undefined;
    if (relationshipAdapter.target instanceof ConcreteEntityAdapter) {
        deleteFieldInput = withDeleteFieldInputType(relationshipAdapter, composer);
    } else {
        deleteFieldInput = withDeleteFieldInputTypeI(relationshipAdapter, composer);
    }
    if (!deleteFieldInput) {
        return;
    }

    const deleteInput = withDeleteInputType({
        entityAdapter: relationshipAdapter.source as ConcreteEntityAdapter | InterfaceEntityAdapter,
        composer,
    });
    if (!deleteInput) {
        return;
    }

    deleteInput.addFields({
        [relationshipAdapter.name]: {
            type: relationshipAdapter.isList ? deleteFieldInput.NonNull.List : deleteFieldInput,
            directives: deprecatedDirectives,
        },
    });
}

export function augmentDeleteInputTypeWithUnionDeleteFieldInput({
    relationshipAdapter,
    composer,
    deprecatedDirectives,
}: {
    relationshipAdapter: RelationshipAdapter;
    composer: SchemaComposer;
    deprecatedDirectives: Directive[];
}) {
    let deleteFieldInput: InputTypeComposer | undefined;
    if (relationshipAdapter.target instanceof UnionEntityAdapter) {
        deleteFieldInput = withUnionDeleteInputType({ relationshipAdapter, composer, deprecatedDirectives });
    }
    if (!deleteFieldInput) {
        return;
    }

    const deleteInput = withDeleteInputType({
        entityAdapter: relationshipAdapter.source as ConcreteEntityAdapter | InterfaceEntityAdapter,
        composer,
    });
    if (!deleteInput) {
        return;
    }

    deleteInput.addFields({
        [relationshipAdapter.name]: {
            type: deleteFieldInput,
            directives: deprecatedDirectives,
        },
    });
}

export function withUnionDeleteInputType({
    relationshipAdapter,
    composer,
    deprecatedDirectives,
}: {
    relationshipAdapter: RelationshipAdapter;
    composer: SchemaComposer;
    deprecatedDirectives: Directive[];
}): InputTypeComposer | undefined {
    if (!relationshipAdapter.nestedOperations.has(RelationshipNestedOperationsOption.DELETE)) {
        return;
    }
    const deleteInput = composer.getOrCreateITC(relationshipAdapter.operations.unionDeleteInputTypeName);

    if (!(relationshipAdapter.target instanceof UnionEntityAdapter)) {
        throw new Error("Expected union target");
    }
    for (const memberEntity of relationshipAdapter.target.concreteEntities) {
        const fieldInput = withDeleteFieldInputTypeU(relationshipAdapter, memberEntity, composer);
        if (fieldInput) {
            deleteInput.addFields({
                [memberEntity.name]: {
                    type: relationshipAdapter.isList ? fieldInput.NonNull.List : fieldInput,
                    directives: deprecatedDirectives,
                },
            });
        }
    }

    return deleteInput;
}
