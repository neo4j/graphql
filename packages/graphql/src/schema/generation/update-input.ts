import type { DirectiveNode } from "graphql";
import type {
    Directive,
    InputTypeComposer,
    InputTypeComposerFieldConfigMap,
    InputTypeComposerFieldConfigMapDefinition,
    SchemaComposer,
} from "graphql-compose";
import { ConcreteEntityAdapter } from "../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { InterfaceEntityAdapter } from "../../schema-model/entity/model-adapters/InterfaceEntityAdapter";
import { UnionEntityAdapter } from "../../schema-model/entity/model-adapters/UnionEntityAdapter";
import { RelationshipAdapter } from "../../schema-model/relationship/model-adapters/RelationshipAdapter";
import { concreteEntityToUpdateInputFields, withArrayOperators, withMathOperators } from "../to-compose";
import { withUpdateFieldInputType, withUpdateFieldInputTypeI, withUpdateFieldInputTypeU } from "./create-input";
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
            : // : entityAdapter.operations.updateMutationArgumentNames.update; TODO
              entityAdapter.operations.updateInputTypeName;
    if (composer.has(inputTypeName)) {
        return composer.getITC(inputTypeName);
    }
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

export function augmentUpdateInputTypeWithUpdateFieldInput({
    relationshipAdapter,
    composer,
    userDefinedFieldDirectives,
    deprecatedDirectives,
}: {
    relationshipAdapter: RelationshipAdapter;
    composer: SchemaComposer;
    userDefinedFieldDirectives: Map<string, DirectiveNode[]>;
    deprecatedDirectives: Directive[];
}) {
    const updateInput = withUpdateInputType({
        entityAdapter: relationshipAdapter.source as ConcreteEntityAdapter | InterfaceEntityAdapter,
        userDefinedFieldDirectives,
        composer,
    });
    if (!updateInput) {
        return;
    }
    let updateFieldInput: InputTypeComposer | undefined;
    if (relationshipAdapter.target instanceof ConcreteEntityAdapter) {
        updateFieldInput = withUpdateFieldInputType(relationshipAdapter, composer, userDefinedFieldDirectives);
    } else {
        updateFieldInput = withUpdateFieldInputTypeI(relationshipAdapter, composer, userDefinedFieldDirectives);
    }
    if (!updateFieldInput) {
        return;
    }
    updateInput.addFields({
        [relationshipAdapter.name]: {
            type: relationshipAdapter.isList ? updateFieldInput.NonNull.List : updateFieldInput,
            directives: deprecatedDirectives,
        },
    });
}

export function augmentUpdateInputTypeWithUnionUpdateFieldInput({
    relationshipAdapter,
    composer,
    deprecatedDirectives,
    userDefinedFieldDirectives,
}: {
    relationshipAdapter: RelationshipAdapter;
    composer: SchemaComposer;
    deprecatedDirectives: Directive[];
    userDefinedFieldDirectives: Map<string, DirectiveNode[]>;
}) {
    let updateFieldInput: InputTypeComposer | undefined;
    if (relationshipAdapter.target instanceof UnionEntityAdapter) {
        updateFieldInput = withUnionUpdateInputType({ relationshipAdapter, composer, deprecatedDirectives });
    }
    if (!updateFieldInput) {
        return;
    }

    const updateInput = withUpdateInputType({
        entityAdapter: relationshipAdapter.source as ConcreteEntityAdapter | InterfaceEntityAdapter,
        composer,
        userDefinedFieldDirectives,
    });
    if (!updateInput) {
        return;
    }

    updateInput.addFields({
        [relationshipAdapter.name]: {
            type: updateFieldInput,
            directives: deprecatedDirectives,
        },
    });
}

export function withUnionUpdateInputType({
    relationshipAdapter,
    composer,
    deprecatedDirectives,
}: {
    relationshipAdapter: RelationshipAdapter;
    composer: SchemaComposer;
    deprecatedDirectives: Directive[];
}): InputTypeComposer | undefined {
    if (!(relationshipAdapter.target instanceof UnionEntityAdapter)) {
        throw new Error("Expected union target");
    }
    const fields: InputTypeComposerFieldConfigMapDefinition = {};
    for (const memberEntity of relationshipAdapter.target.concreteEntities) {
        const fieldInput = withUpdateFieldInputTypeU(
            relationshipAdapter,
            memberEntity,
            composer,
            new Map<string, DirectiveNode[]>()
        );
        if (fieldInput) {
            fields[memberEntity.name] = {
                type: relationshipAdapter.isList ? fieldInput.NonNull.List : fieldInput,
                directives: deprecatedDirectives,
            };
        }
    }
    if (!Object.keys(fields).length) {
        return;
    }
    const updateInput = composer.getOrCreateITC(relationshipAdapter.operations.unionUpdateInputTypeName);
    updateInput.addFields(fields);
    return updateInput;
}
