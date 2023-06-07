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

import type { DirectiveNode, InputValueDefinitionNode } from "graphql";
import type { Directive, DirectiveArgs, ObjectTypeComposerFieldConfigAsObjectDefinition } from "graphql-compose";
import type { BaseField, InputField, PrimitiveField, TemporalField } from "../types";
import { DEPRECATE_NOT } from "./constants";
import getFieldTypeMeta from "./get-field-type-meta";
import parseValueNode from "./parse-value-node";
import { idResolver } from "./resolvers/field/id";
import { numericalResolver } from "./resolvers/field/numerical";

export function graphqlArgsToCompose(args: InputValueDefinitionNode[]) {
    return args.reduce((res, arg) => {
        const meta = getFieldTypeMeta(arg.type);

        return {
            ...res,
            [arg.name.value]: {
                type: meta.pretty,
                description: arg.description,
                ...(arg.defaultValue ? { defaultValue: parseValueNode(arg.defaultValue) } : {}),
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

export function objectFieldsToComposeFields(fields: BaseField[]): {
    [k: string]: ObjectTypeComposerFieldConfigAsObjectDefinition<any, any>;
} {
    return fields.reduce((res, field) => {
        if (field.writeonly || field.selectableOptions.onRead === false) {
            return res;
        }

        const newField: ObjectTypeComposerFieldConfigAsObjectDefinition<any, any> = {
            type: field.typeMeta.pretty,
            args: {},
            description: field.description,
        };

        if (field.otherDirectives.length) {
            newField.directives = graphqlDirectivesToCompose(field.otherDirectives);
        }

        if (["Int", "Float"].includes(field.typeMeta.name)) {
            newField.resolve = numericalResolver;
        }

        if (field.typeMeta.name === "ID") {
            newField.resolve = idResolver;
        }

        if (field.arguments) {
            newField.args = graphqlArgsToCompose(field.arguments);
        }

        return { ...res, [field.fieldName]: newField };
    }, {});
}

export function objectFieldsToCreateInputFields(fields: BaseField[]): Record<string, InputField> {
    return fields
        .filter((f) => {
            const isAutogenerate = (f as PrimitiveField)?.autogenerate;
            const isCallback = (f as PrimitiveField)?.callback;
            const isTemporal = (f as TemporalField)?.timestamps;
            const isSettable = f.settableOptions.onCreate;
            return !isAutogenerate && !isCallback && !isTemporal && isSettable;
        })
        .reduce((res: Record<string, InputField>, f) => {
            const fieldType = f.typeMeta.input.create.pretty;
            const defaultValue = (f as PrimitiveField)?.defaultValue;
            const deprecatedDirectives = graphqlDirectivesToCompose(
                f.otherDirectives.filter((directive) => directive.name.value === "deprecated")
            );

            if (defaultValue !== undefined) {
                res[f.fieldName] = {
                    type: fieldType,
                    defaultValue,
                    directives: deprecatedDirectives,
                };
            } else {
                res[f.fieldName] = {
                    type: fieldType,
                    directives: deprecatedDirectives,
                };
            }

            return res;
        }, {});
}

export function objectFieldsToSubscriptionsWhereInputFields(
    typeName: string,
    fields: BaseField[]
): Record<string, InputField> {
    return fields.reduce((res, f) => {
        const fieldType = f.typeMeta.input.where.pretty;

        const ifArrayOfAnyTypeExceptBoolean = f.typeMeta.array && f.typeMeta.name !== "Boolean";
        const ifAnyTypeExceptArrayAndBoolean = !f.typeMeta.array && f.typeMeta.name !== "Boolean";
        const isOneOfNumberTypes = ["Int", "Float", "BigInt"].includes(f.typeMeta.name) && !f.typeMeta.array;
        const isOneOfStringTypes = ["String", "ID"].includes(f.typeMeta.name) && !f.typeMeta.array;
        const isOneOfSpatialTypes = ["Point", "CartesianPoint"].includes(f.typeMeta.name);

        let inputTypeName = f.typeMeta.name;
        if (isOneOfSpatialTypes) {
            inputTypeName = `${inputTypeName}Input`;
        }
        return {
            ...res,
            AND: `[${typeName}SubscriptionWhere!]`,
            OR: `[${typeName}SubscriptionWhere!]`,
            NOT: `${typeName}SubscriptionWhere`,
            [f.fieldName]: fieldType,
            [`${f.fieldName}_NOT`]: {
                type: fieldType,
                directives: [DEPRECATE_NOT],
            },
            ...(ifArrayOfAnyTypeExceptBoolean && {
                [`${f.fieldName}_INCLUDES`]: inputTypeName,
                [`${f.fieldName}_NOT_INCLUDES`]: {
                    type: inputTypeName,
                    directives: [DEPRECATE_NOT],
                },
            }),
            ...(ifAnyTypeExceptArrayAndBoolean && {
                [`${f.fieldName}_IN`]: `[${inputTypeName}]`,
                [`${f.fieldName}_NOT_IN`]: {
                    type: `[${inputTypeName}]`,
                    directives: [DEPRECATE_NOT],
                },
            }),
            ...(isOneOfNumberTypes && {
                [`${f.fieldName}_LT`]: fieldType,
                [`${f.fieldName}_LTE`]: fieldType,
                [`${f.fieldName}_GT`]: fieldType,
                [`${f.fieldName}_GTE`]: fieldType,
            }),
            ...(isOneOfStringTypes && {
                [`${f.fieldName}_STARTS_WITH`]: fieldType,
                [`${f.fieldName}_NOT_STARTS_WITH`]: {
                    type: fieldType,
                    directives: [DEPRECATE_NOT],
                },
                [`${f.fieldName}_ENDS_WITH`]: fieldType,
                [`${f.fieldName}_NOT_ENDS_WITH`]: {
                    type: fieldType,
                    directives: [DEPRECATE_NOT],
                },
                [`${f.fieldName}_CONTAINS`]: fieldType,
                [`${f.fieldName}_NOT_CONTAINS`]: {
                    type: fieldType,
                    directives: [DEPRECATE_NOT],
                },
            }),
        };
    }, {});
}

export function objectFieldsToUpdateInputFields(fields: BaseField[]): Record<string, InputField> {
    return fields.reduce((res, f) => {
        const deprecatedDirectives = graphqlDirectivesToCompose(
            f.otherDirectives.filter((directive) => directive.name.value === "deprecated")
        );

        const staticField = f.readonly || (f as PrimitiveField)?.autogenerate;
        const isSettable = f.settableOptions.onUpdate;
        if (staticField || !isSettable) {
            return res;
        }

        const fieldType = f.typeMeta.input.update.pretty;

        res[f.fieldName] = {
            type: fieldType,
            directives: deprecatedDirectives,
        };

        return res;
    }, {});
}
