import type { InputTypeComposer, InputTypeComposerFieldConfigMapDefinition, SchemaComposer } from "graphql-compose";
import type { InterfaceEntityAdapter } from "../../schema-model/entity/model-adapters/InterfaceEntityAdapter";
import { ensureNonEmptyInput } from "../ensure-non-empty-input";
import { withWhereInputType } from "./where-input";

export function makeImplementationsDisconnectInput({
    interfaceEntityAdapter,
    composer,
}: {
    interfaceEntityAdapter: InterfaceEntityAdapter;
    composer: SchemaComposer;
}): InputTypeComposer | undefined {
    const fields: InputTypeComposerFieldConfigMapDefinition = {};
    for (const entityAdapter of interfaceEntityAdapter.concreteEntities) {
        if (entityAdapter.relationships.size) {
            fields[entityAdapter.name] = {
                type: `[${entityAdapter.operations.disconnectInputTypeName}!]`,
            };
        }
    }
    if (!Object.keys(fields).length) {
        return undefined;
    }

    const implementationsDisconnectType = composer.createInputTC({
        name: interfaceEntityAdapter.operations.whereOnImplementationsDisconnectInputTypeName,
        fields,
    });
    ensureNonEmptyInput(composer, implementationsDisconnectType);
    return implementationsDisconnectType;
}

export function makeImplementationsConnectInput({
    interfaceEntityAdapter,
    composer,
}: {
    interfaceEntityAdapter: InterfaceEntityAdapter;
    composer: SchemaComposer;
}): InputTypeComposer | undefined {
    const fields: InputTypeComposerFieldConfigMapDefinition = {};
    for (const entityAdapter of interfaceEntityAdapter.concreteEntities) {
        // if (entityAdapter.relationships.size && composer.has(entityAdapter.operations.connectInputTypeName)) {
        if (entityAdapter.relationships.size) {
            fields[entityAdapter.name] = {
                type: `[${entityAdapter.operations.connectInputTypeName}!]`,
            };
        }
    }

    if (!Object.keys(fields).length) {
        return undefined;
    }

    const implementationsConnectType = composer.createInputTC({
        name: interfaceEntityAdapter.operations.whereOnImplementationsConnectInputTypeName,
        fields,
    });
    // ensureNonEmptyInput(composer, implementationsConnectType);
    return implementationsConnectType;
}

export function makeImplementationsDeleteInput({
    interfaceEntityAdapter,
    composer,
}: {
    interfaceEntityAdapter: InterfaceEntityAdapter;
    composer: SchemaComposer;
}): InputTypeComposer | undefined {
    const fields: InputTypeComposerFieldConfigMapDefinition = {};
    for (const entityAdapter of interfaceEntityAdapter.concreteEntities) {
        if (entityAdapter.relationships.size) {
            fields[entityAdapter.name] = {
                type: `[${entityAdapter.operations.deleteInputTypeName}!]`,
            };
        }
    }

    if (!Object.keys(fields).length) {
        return undefined;
    }

    const implementationsDeleteType = composer.createInputTC({
        name: interfaceEntityAdapter.operations.whereOnImplementationsDeleteInputTypeName,
        fields,
    });
    // ensureNonEmptyInput(composer, implementationsDeleteType);
    return implementationsDeleteType;
}

export function makeImplementationsUpdateInput({
    interfaceEntityAdapter,
    composer,
}: {
    interfaceEntityAdapter: InterfaceEntityAdapter;
    composer: SchemaComposer;
}): InputTypeComposer {
    const fields: InputTypeComposerFieldConfigMapDefinition = {};
    for (const entityAdapter of interfaceEntityAdapter.concreteEntities) {
        fields[entityAdapter.name] = {
            type: entityAdapter.operations.updateInputTypeName,
        };
    }
    const implementationsUpdateType = composer.createInputTC({
        name: interfaceEntityAdapter.operations.whereOnImplementationsUpdateInputTypeName,
        fields,
    });
    ensureNonEmptyInput(composer, implementationsUpdateType);
    return implementationsUpdateType;
}

// TODO: maybe combine implementationsInputTypes creation into one function?
export function makeImplementationsWhereInput({
    interfaceEntityAdapter,
    composer,
}: {
    interfaceEntityAdapter: InterfaceEntityAdapter;
    composer: SchemaComposer;
}): InputTypeComposer {
    const fields: InputTypeComposerFieldConfigMapDefinition = {};
    for (const entityAdapter of interfaceEntityAdapter.concreteEntities) {
        fields[entityAdapter.name] = {
            type: entityAdapter.operations.whereInputTypeName,
        };
    }
    const implementationsWhereType = composer.createInputTC({
        name: interfaceEntityAdapter.operations.whereOnImplementationsWhereInputTypeName,
        fields,
    });
    ensureNonEmptyInput(composer, implementationsWhereType);
    return implementationsWhereType;
}
