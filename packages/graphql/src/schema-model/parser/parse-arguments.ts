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

import { inspect } from "@graphql-tools/utils";
import type { Maybe } from "@graphql-tools/utils/typings/types";
import type { DirectiveNode, FieldNode, GraphQLDirective, GraphQLField } from "graphql";
import { Kind, isNonNullType, print, valueFromAST } from "graphql";
import type { ObjMap } from "graphql/jsutils/ObjMap";
import { parseValueNode } from "./parse-value-node";

export function parseArgumentsFromUnknownDirective(directive: DirectiveNode): Record<string, unknown> {
    return (directive.arguments || [])?.reduce((acc, argument) => {
        acc[argument.name.value] = parseValueNode(argument.value);
        return acc;
    }, {});
}

/**
 * Polyfill of GraphQL-JS parseArguments, remove it after dropping the support of GraphQL-JS 15.0
 *
 * Prepares an object map of argument values given a list of argument
 * definitions and list of argument AST nodes.
 *
 * Note: The returned value is a plain Object with a prototype, since it is
 * exposed to user code. Care should be taken to not pull values from the
 * Object prototype.
 */
export function parseArguments<T extends Record<string, unknown>>(
    def: GraphQLField<unknown, unknown> | GraphQLDirective,
    node: FieldNode | DirectiveNode,
    variableValues?: Maybe<ObjMap<unknown>>
): T {
    const coercedValues: { [argument: string]: unknown } = {};
    const argumentNodes = node.arguments ?? [];
    const argNodeMap = new Map(argumentNodes.map((arg) => [arg.name.value, arg]));

    for (const argDef of def.args) {
        const name = argDef.name;
        const argType = argDef.type;
        const argumentNode = argNodeMap.get(name);

        if (argumentNode == null) {
            if (argDef.defaultValue !== undefined) {
                coercedValues[name] = argDef.defaultValue;
            } else if (isNonNullType(argType)) {
                throw new Error(`Argument "${name}" of required type "${inspect(argType)}" ` + "was not provided.");
            }
            continue;
        }

        const valueNode = argumentNode.value;
        let isNull = valueNode.kind === Kind.NULL;

        if (valueNode.kind === Kind.VARIABLE) {
            const variableName = valueNode.name.value;
            if (variableValues == null || !Object.prototype.hasOwnProperty.call(variableValues, variableName)) {
                if (argDef.defaultValue !== undefined) {
                    coercedValues[name] = argDef.defaultValue;
                } else if (isNonNullType(argType)) {
                    throw new Error(
                        `Argument "${name}" of required type "${inspect(argType)}" ` +
                            `was provided the variable "$${variableName}" which was not provided a runtime value.`
                    );
                }
                continue;
            }
            isNull = variableValues[variableName] == null;
        }

        if (isNull && isNonNullType(argType)) {
            throw new Error(`Argument "${name}" of non-null type "${inspect(argType)}" ` + "must not be null.");
        }

        const coercedValue = valueFromAST(valueNode, argType, variableValues);
        if (coercedValue === undefined) {
            throw new Error(`Argument "${name}" has invalid value ${print(valueNode)}.`);
        }
        coercedValues[name] = coercedValue;
    }
    return coercedValues as T;
}
