import type { InputTypeComposer, SchemaComposer } from "graphql-compose";
import type { InterfaceEntityAdapter } from "../../schema-model/entity/model-adapters/InterfaceEntityAdapter";
import { makeImplementationsDisconnectInput } from "./implementation-inputs";

export function withDisconnectInputType({
    interfaceEntityAdapter,
    composer,
}: {
    interfaceEntityAdapter: InterfaceEntityAdapter; // required
    composer: SchemaComposer;
}): InputTypeComposer | undefined {
    const implementationsDisconnectInputType = makeImplementationsDisconnectInput({
        interfaceEntityAdapter,
        composer,
    });
    if (implementationsDisconnectInputType) {
        const disconnectInputType = composer.getOrCreateITC(
            interfaceEntityAdapter.operations.updateMutationArgumentNames.disconnect
        );
        disconnectInputType.setField("_on", implementationsDisconnectInputType);
        return disconnectInputType;
    }
    return undefined;
}
