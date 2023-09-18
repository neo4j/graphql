import type { InputTypeComposer, SchemaComposer } from "graphql-compose";
import type { InterfaceEntityAdapter } from "../../schema-model/entity/model-adapters/InterfaceEntityAdapter";
import { makeImplementationsDeleteInput } from "./implementation-inputs";

export function withDeleteInputType({
    interfaceEntityAdapter,
    composer,
}: {
    interfaceEntityAdapter: InterfaceEntityAdapter;
    composer: SchemaComposer;
}): InputTypeComposer | undefined {
    const implementationsUpdateInputType = makeImplementationsDeleteInput({ interfaceEntityAdapter, composer });

    if (!implementationsUpdateInputType) {
        return undefined;
    }

    const deleteInputType = composer.getOrCreateITC(
        interfaceEntityAdapter.operations.updateMutationArgumentNames.delete
    );
    deleteInputType.setField("_on", implementationsUpdateInputType);
    return deleteInputType;
}
