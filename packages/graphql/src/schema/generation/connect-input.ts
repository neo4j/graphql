import type { InputTypeComposer, SchemaComposer } from "graphql-compose";
import type { InterfaceEntityAdapter } from "../../schema-model/entity/model-adapters/InterfaceEntityAdapter";
import { makeImplementationsConnectInput } from "./implementation-inputs";

export function withConnectInputType({
    interfaceEntityAdapter,
    composer,
}: {
    interfaceEntityAdapter: InterfaceEntityAdapter;
    composer: SchemaComposer;
}): InputTypeComposer | undefined {
    const implementationsConnectInputType = makeImplementationsConnectInput({
        interfaceEntityAdapter,
        composer,
    });

    if (!implementationsConnectInputType) {
        return undefined;
    }

    const connectInputType = composer.getOrCreateITC(
        interfaceEntityAdapter.operations.updateMutationArgumentNames.connect
    );
    connectInputType.setField("_on", implementationsConnectInputType);
    return connectInputType;
}
