/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 *
 * This file is part of Neo4j.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
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
    entityAdapter: ConcreteEntityAdapter | InterfaceEntityAdapter;
    userDefinedFieldDirectives: Map<string, DirectiveNode[]>;
    composer: SchemaComposer;
}): InputTypeComposer {
    const optionsInputType = makeOptionsInput({ entityAdapter, composer });
    const sortInput = makeSortInput({ entityAdapter, userDefinedFieldDirectives, composer });
    if (!sortInput) {
        return optionsInputType;
    }
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
    relationshipAdapter: RelationshipAdapter;
    userDefinedFieldDirectives: Map<string, DirectiveNode[]>;
    composer: SchemaComposer;
}): InputTypeComposer | undefined {
    // TODO: Use the commented code when we want to unify the sort input type for relationships and entities
    // if (!relationshipAdapter.sortableFields.length) {
    //     return undefined;
    // }
    // return makeSortInput({ entityAdapter: relationshipAdapter, userDefinedFieldDirectives, composer });

    const sortFields: InputTypeComposerFieldConfigMapDefinition = {};
    for (const attribute of relationshipAdapter.attributes.values()) {
        const userDefinedDirectivesOnField = userDefinedFieldDirectives.get(attribute.name) || [];
        const deprecatedDirective = userDefinedDirectivesOnField.filter(
            (directive) => directive.name.value === DEPRECATED
        );
        sortFields[attribute.name] = {
            type: SortDirection,
            directives: graphqlDirectivesToCompose(deprecatedDirective),
        };
    }
    const sortInput = composer.createInputTC({
        name: relationshipAdapter.operations.sortInputTypeName,
        fields: sortFields,
    });

    return sortInput;
}

function makeSortFields({
    entityAdapter,
    userDefinedFieldDirectives,
}: {
    entityAdapter: ConcreteEntityAdapter | InterfaceEntityAdapter | RelationshipAdapter;
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
    entityAdapter: ConcreteEntityAdapter | InterfaceEntityAdapter | RelationshipAdapter;
    userDefinedFieldDirectives: Map<string, DirectiveNode[]>;
    composer: SchemaComposer;
}): InputTypeComposer | undefined {
    const sortFields = makeSortFields({ entityAdapter, userDefinedFieldDirectives });
    if (!Object.keys(sortFields).length) {
        return;
    }
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
    entityAdapter: ConcreteEntityAdapter | InterfaceEntityAdapter;
    composer: SchemaComposer;
}): InputTypeComposer {
    const optionsInput = composer.createInputTC({
        name: entityAdapter.operations.optionsInputTypeName,
        fields: { limit: GraphQLInt, offset: GraphQLInt },
    });
    return optionsInput;
}
