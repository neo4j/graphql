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

import type { DirectiveNode } from "graphql";
import { GraphQLInt } from "graphql";
import type {
    Directive,
    DirectiveArgs,
    InputTypeComposerFieldConfigMapDefinition,
    ObjectTypeComposerFieldConfigAsObjectDefinition,
} from "graphql-compose";
import { DEPRECATED } from "../constants";
import type { Argument } from "../schema-model/argument/Argument";
import { ArgumentAdapter } from "../schema-model/argument/model-adapters/ArgumentAdapter";
import type { AttributeAdapter } from "../schema-model/attribute/model-adapters/AttributeAdapter";
import { parseValueNode } from "../schema-model/parser/parse-value-node";
import type { InputField } from "../types";
import { idResolver } from "./resolvers/field/id";
import { numericalResolver } from "./resolvers/field/numerical";

export function graphqlArgsToCompose(args: Argument[]) {
    return args.reduce((res, arg) => {
        const inputValueAdapter = new ArgumentAdapter(arg);

        return {
            ...res,
            [arg.name]: {
                type: inputValueAdapter.getTypePrettyName(),
                description: inputValueAdapter.description,
                ...(inputValueAdapter.defaultValue !== undefined
                    ? { defaultValue: inputValueAdapter.defaultValue }
                    : {}),
            },
        };
    }, {});
}

export function graphqlDirectivesToCompose(directives: DirectiveNode[]): Directive[] {
    return directives.map((directive) => ({
        args: (directive.arguments || [])?.reduce(
            (r: DirectiveArgs, d) => ({ ...r, [d.name.value]: parseValueNode(d.value) }),
            {}
        ),
        name: directive.name.value,
    }));
}

export function attributeAdapterToComposeFields(
    objectFields: AttributeAdapter[],
    userDefinedFieldDirectives: Map<string, DirectiveNode[]>
): Record<string, ObjectTypeComposerFieldConfigAsObjectDefinition<any, any>> {
    const composeFields: Record<string, ObjectTypeComposerFieldConfigAsObjectDefinition<any, any>> = {};
    for (const field of objectFields) {
        if (field.isReadable() === false) {
            continue;
        }

        const newField: ObjectTypeComposerFieldConfigAsObjectDefinition<any, any> = {
            type: field.getTypePrettyName(),
            args: {},
            description: field.description,
        };

        const userDefinedDirectivesOnField = userDefinedFieldDirectives.get(field.name);
        if (userDefinedDirectivesOnField) {
            newField.directives = graphqlDirectivesToCompose(userDefinedDirectivesOnField);
        }

        if (field.typeHelper.isInt() || field.typeHelper.isFloat()) {
            newField.resolve = numericalResolver;
        }

        if (field.typeHelper.isID()) {
            newField.resolve = idResolver;
        }

        if (field.args) {
            newField.args = graphqlArgsToCompose(field.args);
        }

        composeFields[field.name] = newField;
    }

    return composeFields;
}

export function concreteEntityToCreateInputFields(
    objectFields: AttributeAdapter[],
    userDefinedFieldDirectives: Map<string, DirectiveNode[]>
) {
    const createInputFields: Record<string, InputField> = {};
    for (const field of objectFields) {
        const newInputField: InputField = {
            type: field.getInputTypeNames().create.pretty,
            defaultValue: field.getDefaultValue(),
            directives: [],
        };

        const userDefinedDirectivesOnField = userDefinedFieldDirectives.get(field.name);
        if (userDefinedDirectivesOnField) {
            newInputField.directives = graphqlDirectivesToCompose(
                userDefinedDirectivesOnField.filter((directive) => directive.name.value === DEPRECATED)
            );
        }

        createInputFields[field.name] = newInputField;
    }

    return createInputFields;
}

export function concreteEntityToUpdateInputFields(
    objectFields: AttributeAdapter[],
    userDefinedFieldDirectives: Map<string, DirectiveNode[]>,
    additionalFieldsCallbacks: AdditionalFieldsCallback[] = []
) {
    let updateInputFields: InputTypeComposerFieldConfigMapDefinition = {};
    for (const field of objectFields) {
        const newInputField: InputField = {
            type: field.getInputTypeNames().update.pretty,
            directives: [],
        };

        const userDefinedDirectivesOnField = userDefinedFieldDirectives.get(field.name);
        if (userDefinedDirectivesOnField) {
            newInputField.directives = graphqlDirectivesToCompose(
                userDefinedDirectivesOnField.filter((directive) => directive.name.value === DEPRECATED)
            );
        }

        updateInputFields[field.name] = newInputField;

        for (const cb of additionalFieldsCallbacks) {
            const additionalFields = cb(field, newInputField);
            updateInputFields = { ...updateInputFields, ...additionalFields };
        }
    }

    return updateInputFields;
}

export function withMathOperators(): AdditionalFieldsCallback {
    return (attribute: AttributeAdapter, fieldDefinition: InputField): Record<string, InputField> => {
        const fields: Record<string, InputField> = {};
        if (attribute.mathModel) {
            for (const operation of attribute.mathModel.getMathOperations()) {
                fields[operation] = fieldDefinition;
            }
        }
        return fields;
    };
}

export function withArrayOperators(): AdditionalFieldsCallback {
    return (attribute: AttributeAdapter): InputTypeComposerFieldConfigMapDefinition => {
        const fields: InputTypeComposerFieldConfigMapDefinition = {};
        if (attribute.listModel) {
            fields[attribute.listModel.getPop()] = GraphQLInt;
            fields[attribute.listModel.getPush()] = attribute.getInputTypeNames().update.pretty;
        }
        return fields;
    };
}

type AdditionalFieldsCallback = (
    attribute: AttributeAdapter,
    fieldDefinition: InputField
) => Record<string, InputField> | InputTypeComposerFieldConfigMapDefinition;
