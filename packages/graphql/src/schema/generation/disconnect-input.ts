import type { Directive, InputTypeComposer, SchemaComposer } from "graphql-compose";
import { RelationshipNestedOperationsOption } from "../../constants";
import { ConcreteEntityAdapter } from "../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { InterfaceEntityAdapter } from "../../schema-model/entity/model-adapters/InterfaceEntityAdapter";
import { UnionEntityAdapter } from "../../schema-model/entity/model-adapters/UnionEntityAdapter";
import { RelationshipAdapter } from "../../schema-model/relationship/model-adapters/RelationshipAdapter";
import {
    withDisconnectFieldInputType,
    withDisconnectFieldInputTypeI,
    withDisconnectFieldInputTypeU,
} from "./create-input";
import { makeImplementationsDisconnectInput } from "./implementation-inputs";

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
    const implementationsDisconnectInputType = makeImplementationsDisconnectInput({
        interfaceEntityAdapter: entityAdapter,
        composer,
    });

    if (!implementationsDisconnectInputType) {
        return undefined;
    }

    const disconnectInputType = composer.getOrCreateITC(
        entityAdapter.operations.updateMutationArgumentNames.disconnect
    );
    disconnectInputType.setField("_on", implementationsDisconnectInputType);
    return disconnectInputType;
}

export function augmentDisconnectInputTypeWithDisconnectFieldInput({
    relationshipAdapter,
    composer,
    deprecatedDirectives,
}: {
    relationshipAdapter: RelationshipAdapter;
    composer: SchemaComposer;
    deprecatedDirectives: Directive[];
}) {
    let disconnectFieldInput: InputTypeComposer | undefined;
    if (relationshipAdapter.target instanceof ConcreteEntityAdapter) {
        disconnectFieldInput = withDisconnectFieldInputType(relationshipAdapter, composer);
    } else {
        disconnectFieldInput = withDisconnectFieldInputTypeI(relationshipAdapter, composer);
    }
    if (!disconnectFieldInput) {
        return;
    }

    const disconnectInput = withDisconnectInputType({
        entityAdapter: relationshipAdapter.source as ConcreteEntityAdapter | InterfaceEntityAdapter,
        composer,
    });
    if (!disconnectInput) {
        return;
    }

    disconnectInput.addFields({
        [relationshipAdapter.name]: {
            type: relationshipAdapter.isList ? disconnectFieldInput.NonNull.List : disconnectFieldInput,
            directives: deprecatedDirectives,
        },
    });
}

export function augmentDisconnectInputTypeWithUnionConnectFieldInput({
    relationshipAdapter,
    composer,
    deprecatedDirectives,
}: {
    relationshipAdapter: RelationshipAdapter;
    composer: SchemaComposer;
    deprecatedDirectives: Directive[];
}) {
    let disconnectFieldInput: InputTypeComposer | undefined;
    if (relationshipAdapter.target instanceof UnionEntityAdapter) {
        disconnectFieldInput = withUnionDisonnectInputType({ relationshipAdapter, composer, deprecatedDirectives });
    }
    if (!disconnectFieldInput) {
        return;
    }

    const disconnectInput = withDisconnectInputType({
        entityAdapter: relationshipAdapter.source as ConcreteEntityAdapter | InterfaceEntityAdapter,
        composer,
    });
    if (!disconnectInput) {
        return;
    }

    disconnectInput.addFields({
        [relationshipAdapter.name]: {
            type: disconnectFieldInput,
            directives: deprecatedDirectives,
        },
    });
}

export function withUnionDisonnectInputType({
    relationshipAdapter,
    composer,
    deprecatedDirectives,
}: {
    relationshipAdapter: RelationshipAdapter;
    composer: SchemaComposer;
    deprecatedDirectives: Directive[];
}): InputTypeComposer | undefined {
    if (!relationshipAdapter.nestedOperations.has(RelationshipNestedOperationsOption.DISCONNECT)) {
        return;
    }
    const disconnectInput = composer.getOrCreateITC(relationshipAdapter.operations.unionDisconnectInputTypeName);

    if (!(relationshipAdapter.target instanceof UnionEntityAdapter)) {
        throw new Error("Expected union target");
    }
    for (const memberEntity of relationshipAdapter.target.concreteEntities) {
        const fieldInput = withDisconnectFieldInputTypeU(relationshipAdapter, memberEntity, composer);
        if (fieldInput) {
            disconnectInput.addFields({
                [memberEntity.name]: {
                    type: relationshipAdapter.isList ? fieldInput.NonNull.List : fieldInput,
                    directives: deprecatedDirectives,
                },
            });
        }
    }

    return disconnectInput;
}
