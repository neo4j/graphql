import { GraphQLInt, type DirectiveNode } from "graphql";
import type { InputTypeComposer, InputTypeComposerFieldConfigMapDefinition, SchemaComposer } from "graphql-compose";
import { DEPRECATED } from "../../constants";
import { SortDirection } from "../../graphql/enums/SortDirection";
import { ConcreteEntityAdapter } from "../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { InterfaceEntityAdapter } from "../../schema-model/entity/model-adapters/InterfaceEntityAdapter";
import { RelationshipAdapter } from "../../schema-model/relationship/model-adapters/RelationshipAdapter";
import { graphqlDirectivesToCompose } from "../to-compose";

export function withOptionsInputType({
    entityAdapter,
    userDefinedFieldDirectives,
    composer,
}: {
    entityAdapter: ConcreteEntityAdapter | InterfaceEntityAdapter; // required
    userDefinedFieldDirectives: Map<string, DirectiveNode[]>;
    composer: SchemaComposer;
}): InputTypeComposer {
    const optionsInputType = makeOptionsInput({ entityAdapter, composer });
    if (!entityAdapter.sortableFields.length) {
        return optionsInputType;
    }
    const sortInput = makeSortInput({ entityAdapter, userDefinedFieldDirectives, composer });
    // TODO: Concrete vs Abstract discrepancy
    // is this intended? For ConcreteEntity is NonNull, for InterfaceEntity is nullable
    const sortFieldType = entityAdapter instanceof ConcreteEntityAdapter ? sortInput.NonNull.List : sortInput.List;
    optionsInputType.addFields({
        sort: {
            description: `Specify one or more ${entityAdapter.operations.sortInputTypeName} objects to sort ${entityAdapter.upperFirstPlural} by. The sorts will be applied in the order in which they are arranged in the array.`,
            type: sortFieldType,
        },
    });
    return optionsInputType;
}

export function withSortInputType({
    relationshipAdapter,
    userDefinedFieldDirectives,
    composer,
}: {
    relationshipAdapter: RelationshipAdapter; // required
    userDefinedFieldDirectives: Map<string, DirectiveNode[]>;
    composer: SchemaComposer;
}): InputTypeComposer | undefined {
    // TODO: for relationships we used to get all attributes, not just sortableFields
    // Clarify if this is intended?
    if (!relationshipAdapter.sortableFields.length) {
        return;
    }
    return makeSortInput({ entityAdapter: relationshipAdapter, userDefinedFieldDirectives, composer });
}

function makeSortFields({
    entityAdapter,
    userDefinedFieldDirectives,
}: {
    entityAdapter: ConcreteEntityAdapter | InterfaceEntityAdapter | RelationshipAdapter; // required
    userDefinedFieldDirectives: Map<string, DirectiveNode[]>;
}): InputTypeComposerFieldConfigMapDefinition {
    const sortFields: InputTypeComposerFieldConfigMapDefinition = {};
    const sortableAttributes = entityAdapter.sortableFields;
    for (const attribute of sortableAttributes) {
        const userDefinedDirectivesOnField = userDefinedFieldDirectives.get(attribute.name) || [];
        const deprecatedDirective = userDefinedDirectivesOnField.filter(
            (directive) => directive.name.value === DEPRECATED
        );
        sortFields[attribute.name] = {
            type: SortDirection,
            directives: graphqlDirectivesToCompose(deprecatedDirective),
        };
    }
    return sortFields;
}

function makeSortInput({
    entityAdapter,
    userDefinedFieldDirectives,
    composer,
}: {
    entityAdapter: ConcreteEntityAdapter | InterfaceEntityAdapter | RelationshipAdapter; // required
    userDefinedFieldDirectives: Map<string, DirectiveNode[]>;
    composer: SchemaComposer;
}): InputTypeComposer {
    const sortFields = makeSortFields({ entityAdapter, userDefinedFieldDirectives });
    const sortInput = composer.createInputTC({
        name: entityAdapter.operations.sortInputTypeName,
        fields: sortFields,
    });
    if (!(entityAdapter instanceof RelationshipAdapter)) {
        sortInput.setDescription(
            `Fields to sort ${entityAdapter.upperFirstPlural} by. The order in which sorts are applied is not guaranteed when specifying many fields in one ${entityAdapter.operations.sortInputTypeName} object.`
        );
    }
    return sortInput;
}

function makeOptionsInput({
    entityAdapter,
    composer,
}: {
    entityAdapter: ConcreteEntityAdapter | InterfaceEntityAdapter; // required
    composer: SchemaComposer;
}): InputTypeComposer {
    const optionsInput = composer.createInputTC({
        name: entityAdapter.operations.optionsInputTypeName,
        fields: { limit: GraphQLInt, offset: GraphQLInt },
    });
    return optionsInput;
}