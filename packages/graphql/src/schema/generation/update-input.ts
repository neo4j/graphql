import type { DirectiveNode } from "graphql";
import type { InputTypeComposer, SchemaComposer } from "graphql-compose";
import { ConcreteEntityAdapter } from "../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { InterfaceEntityAdapter } from "../../schema-model/entity/model-adapters/InterfaceEntityAdapter";
import { RelationshipAdapter } from "../../schema-model/relationship/model-adapters/RelationshipAdapter";
import { concreteEntityToUpdateInputFields, withArrayOperators, withMathOperators } from "../to-compose";
import { makeImplementationsUpdateInput } from "./implementation-inputs";

export function withUpdateInputType({
    entityAdapter,
    userDefinedFieldDirectives,
    composer,
}: {
    entityAdapter: ConcreteEntityAdapter | InterfaceEntityAdapter | RelationshipAdapter;
    userDefinedFieldDirectives: Map<string, DirectiveNode[]>;
    composer: SchemaComposer;
}): InputTypeComposer {
    const inputTypeName =
        entityAdapter instanceof RelationshipAdapter
            ? entityAdapter.operations.edgeUpdateInputTypeName
            : entityAdapter.operations.updateMutationArgumentNames.update;
    const updateInputType = composer.createInputTC({
        name: inputTypeName,
        fields: {},
    });

    if (entityAdapter instanceof ConcreteEntityAdapter || entityAdapter instanceof RelationshipAdapter) {
        updateInputType.addFields(
            concreteEntityToUpdateInputFields(entityAdapter.updateInputFields, userDefinedFieldDirectives, [
                withMathOperators(),
                withArrayOperators(),
            ])
        );
    } else {
        updateInputType.addFields(
            concreteEntityToUpdateInputFields(entityAdapter.updateInputFields, userDefinedFieldDirectives, [
                withMathOperators(),
            ])
        );
        const implementationsUpdateInputType = makeImplementationsUpdateInput({
            interfaceEntityAdapter: entityAdapter,
            composer,
        });
        updateInputType.addFields({ _on: implementationsUpdateInputType });
    }

    // ensureNonEmptyInput(composer, updateInputType); - not for relationshipAdapter
    return updateInputType;
}
