import type { DirectiveNode } from "graphql";
import type { InputTypeComposer, InputTypeComposerFieldConfigMapDefinition, SchemaComposer } from "graphql-compose";
import { ConcreteEntityAdapter } from "../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { InterfaceEntityAdapter } from "../../schema-model/entity/model-adapters/InterfaceEntityAdapter";
import { RelationshipAdapter } from "../../schema-model/relationship/model-adapters/RelationshipAdapter";
import { concreteEntityToCreateInputFields } from "../to-compose";

export function withCreateInputType({
    entityAdapter,
    userDefinedFieldDirectives,
    composer,
}: {
    entityAdapter: ConcreteEntityAdapter | InterfaceEntityAdapter | RelationshipAdapter;
    userDefinedFieldDirectives: Map<string, DirectiveNode[]>;
    composer: SchemaComposer;
}): InputTypeComposer {
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
    interfaceEntityAdapter: InterfaceEntityAdapter
): InputTypeComposerFieldConfigMapDefinition {
    const fields: InputTypeComposerFieldConfigMapDefinition = {};
    for (const entityAdapter of interfaceEntityAdapter.concreteEntities) {
        fields[entityAdapter.name] = {
            type: entityAdapter.operations.createInputTypeName,
        };
    }
    return fields;
}
