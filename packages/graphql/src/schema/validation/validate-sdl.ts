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

import type { Maybe } from "@graphql-tools/utils/typings/types";
import type { ArgumentNode, DirectiveNode, DocumentNode, GraphQLSchema } from "graphql";
import { Kind, GraphQLError, visit, visitInParallel } from "graphql";
import type { SDLValidationRule } from "graphql/validation/ValidationContext";
import { SDLValidationContext } from "graphql/validation/ValidationContext";
import { AUTHORIZATION_ERROR_CODE } from "./custom-rules/directive-argument-of-correct-type";

export function validateSDL(
    documentAST: DocumentNode,
    rules: ReadonlyArray<SDLValidationRule>,
    schemaToExtend?: Maybe<GraphQLSchema>
): ReadonlyArray<GraphQLError> {
    const errors: Array<GraphQLError> = [];
    const context = new SDLValidationContext(documentAST, schemaToExtend, (error) => {
        // console.log(
        //     "error:",
        //     error.locations,
        //     // error.name,
        //     JSON.stringify(error.extensions, null, 2),
        //     error.nodes,
        //     // error.originalError,
        //     error.stack,
        //     error.path,
        //     error.source,
        //     error.positions,
        //     error.message
        // );

        const mappedError = mapError(error);
        errors.push(mappedError);
    });
    const visitors = rules.map((rule) => rule(context));
    visit(documentAST, visitInParallel(visitors));
    return errors;
}

function mapError(error: GraphQLError): GraphQLError {
    const { nodes, message } = error;

    if (isStandardRuleError(error)) {
        // comes from standard graphql validation rules
        const renamedDirectiveMatch = new RegExp(authorizationValidationErrorRegExp.renamedDirective).exec(message);
        if (!renamedDirectiveMatch) {
            return error;
        }
        const [, directiveName, typeName] = renamedDirectiveMatch;
        const replacedStr = directiveName ? message.replace(directiveName, "@authorization") : message;
        const path: string[] = [typeName, "@authorization"].filter((x) => x) as string[];
        if (nodes?.length && nodes[0]) {
            if (nodes[0].kind === Kind.ARGUMENT) {
                const nodeName = nodes[0].name.value;
                path.push(nodeName);
            }
        }
        return new GraphQLError(replacedStr, { path });
    }
    // argument type rules
    const [argumentNode, directiveNode] = nodes as [ArgumentNode, DirectiveNode];
    if (!argumentNode && !directiveNode) {
        return error;
    }
    const directiveName = directiveNode?.name.value || "";
    const argumentName = argumentNode?.name.value || "";
    const typename = directiveName.split("Authorization")[0] || "";
    const path: (string | number)[] = [typename, "@authorization", argumentName].filter((x) => x);
    path.push(...(error.path || []));

    const needToFigureOut =
        /(?:(?:String)|(?:Int)|(?:Float)|(?:Boolean))(?: cannot represent a?\s?)(?:(?:non string)|(?:non-integer)|(?:non numeric)|(?:non boolean))(?: value)(:.+)/g;
    const stillNeedToFigureOut = needToFigureOut.exec(message);
    if (stillNeedToFigureOut?.length) {
        const value = stillNeedToFigureOut[1];
        const replacedStr = value ? message.replace(value, ".") : message;
        return new GraphQLError(replacedStr, { path });
    }

    const mysteryTypeRegex = composeRegex(
        authorizationValidationErrorRegExp.generatedType,
        authorizationValidationErrorRegExp.whereType
    );
    const res = mysteryTypeRegex.exec(message);
    if (!res) {
        return new GraphQLError(message, { path });
    }
    const mysteryType = res[1] || res[2];
    const replacedStr = mysteryType ? message.replace(mysteryType, "") : message;

    return new GraphQLError(replacedStr, { path });
}

function composeRegex(...regexes: RegExp[]) {
    return new RegExp(regexes.map((r) => r.source).join("|"));
}

function isStandardRuleError(error: GraphQLError): boolean {
    const { extensions } = error;
    return (
        !extensions ||
        !extensions["exception"] ||
        !Object.keys(extensions.exception).length ||
        extensions.exception["code"] !== AUTHORIZATION_ERROR_CODE
    );
}

const authorizationValidationErrorRegExp: Record<"generatedType" | "whereType" | "renamedDirective", RegExp> = {
    generatedType: /(\s?"[^\s]*?Authorization[^\s]*?")/g,
    whereType: /type(\s\\?".+?\\?")/g, // <typename>Where / JwtPayloadWhere
    renamedDirective: /"(@(.+?)Authorization)"/g,
};
