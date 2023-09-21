import type { Directive, InputTypeComposer, SchemaComposer } from "graphql-compose";
import { RelationshipNestedOperationsOption } from "../../constants";
import { ConcreteEntityAdapter } from "../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import { InterfaceEntityAdapter } from "../../schema-model/entity/model-adapters/InterfaceEntityAdapter";
import { UnionEntityAdapter } from "../../schema-model/entity/model-adapters/UnionEntityAdapter";
import { RelationshipAdapter } from "../../schema-model/relationship/model-adapters/RelationshipAdapter";
import { withConnectFieldInputType, withConnectFieldInputTypeI, withConnectFieldInputTypeU } from "./create-input";
import { makeImplementationsConnectInput } from "./implementation-inputs";

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
    const implementationsConnectInputType = makeImplementationsConnectInput({
        interfaceEntityAdapter: entityAdapter,
        composer,
    });

    if (!implementationsConnectInputType) {
        return undefined;
    }

    const connectInputType = composer.getOrCreateITC(entityAdapter.operations.connectInputTypeName);
    connectInputType.setField("_on", implementationsConnectInputType);
    return connectInputType;
}

export function augmentConnectInputTypeWithConnectFieldInput({
    relationshipAdapter,
    composer,
    deprecatedDirectives,
}: {
    relationshipAdapter: RelationshipAdapter;
    composer: SchemaComposer;
    deprecatedDirectives: Directive[];
}) {
    let connectFieldInput: InputTypeComposer | undefined;
    if (relationshipAdapter.target instanceof ConcreteEntityAdapter) {
        connectFieldInput = withConnectFieldInputType(relationshipAdapter, composer);
    } else if (relationshipAdapter.target instanceof InterfaceEntityAdapter) {
        connectFieldInput = withConnectFieldInputTypeI(relationshipAdapter, composer);
    }
    if (!connectFieldInput) {
        return;
    }

    const connectInput = withConnectInputType({
        entityAdapter: relationshipAdapter.source as ConcreteEntityAdapter | InterfaceEntityAdapter,
        composer,
    });
    if (!connectInput) {
        return;
    }

    connectInput.addFields({
        [relationshipAdapter.name]: {
            type: relationshipAdapter.isList ? connectFieldInput.NonNull.List : connectFieldInput,
            directives: deprecatedDirectives,
        },
    });
}

export function augmentConnectInputTypeWithUnionConnectFieldInput({
    relationshipAdapter,
    composer,
    deprecatedDirectives,
}: {
    relationshipAdapter: RelationshipAdapter;
    composer: SchemaComposer;
    deprecatedDirectives: Directive[];
}) {
    let connectFieldInput: InputTypeComposer | undefined;
    if (relationshipAdapter.target instanceof UnionEntityAdapter) {
        connectFieldInput = withUnionConnectInputType({ relationshipAdapter, composer, deprecatedDirectives });
    }
    if (!connectFieldInput) {
        return;
    }

    const connectInput = withConnectInputType({
        entityAdapter: relationshipAdapter.source as ConcreteEntityAdapter | InterfaceEntityAdapter,
        composer,
    });
    if (!connectInput) {
        return;
    }

    connectInput.addFields({
        [relationshipAdapter.name]: {
            type: connectFieldInput,
            directives: deprecatedDirectives,
        },
    });
}

export function withUnionConnectInputType({
    relationshipAdapter,
    composer,
    deprecatedDirectives,
}: {
    relationshipAdapter: RelationshipAdapter;
    composer: SchemaComposer;
    deprecatedDirectives: Directive[];
}): InputTypeComposer | undefined {
    if (!relationshipAdapter.nestedOperations.has(RelationshipNestedOperationsOption.CONNECT)) {
        return;
    }
    const connectInput = composer.getOrCreateITC(relationshipAdapter.operations.unionConnectInputTypeName);

    if (!(relationshipAdapter.target instanceof UnionEntityAdapter)) {
        throw new Error("Expected union target");
    }
    for (const memberEntity of relationshipAdapter.target.concreteEntities) {
        const fieldInput = withConnectFieldInputTypeU(relationshipAdapter, memberEntity, composer);
        if (fieldInput) {
            connectInput.addFields({
                [memberEntity.name]: {
                    type: relationshipAdapter.isList ? fieldInput.NonNull.List : fieldInput,
                    directives: deprecatedDirectives,
                },
            });
        }
    }

    return connectInput;
}
