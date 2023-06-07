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
import { GraphQLError, visit, visitInParallel } from "graphql";
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
        /*
        console.log(
            "error:",
            // error.locations,
            // error.name,
            JSON.stringify(error.extensions, null, 2),
            error.nodes,
            // error.originalError,
            error.stack,
            // error.path,
            // error.source,
            // error.positions,
            error.message
        );
        */
        const mappedError = mapError(error);
        errors.push(mappedError);
    });
    const visitors = rules.map((rule) => rule(context));
    visit(documentAST, visitInParallel(visitors));
    return errors;
}

function mapError(error: GraphQLError): GraphQLError {
    const { nodes, extensions, message } = error;
    // TODO: fix these.
    const needToFigureOut =
        /\bString\b|\bInt\b|\bFloat\b|\bBoolean\b cannot represent \bnon string\b|\bnon-integer\b|\bnon numeric\b|\bnon boolean\b value/g;
    const stillNeedToFigureOut = needToFigureOut.exec(message);
    if (stillNeedToFigureOut) {
        return error;
    }

    if (
        extensions &&
        extensions.exception &&
        Object.keys(extensions.exception).length &&
        extensions.exception["code"] !== AUTHORIZATION_ERROR_CODE
    ) {
        // comes from standard graphql validation rules => is not argument type
        const typenameRegex = /"@(.+?)Authorization"/g;
        const res = typenameRegex.exec(message);
        if (!res) {
            return error;
        }
        const [directiveName, typename] = res;
        const locationStr = `Location: type \`${typename}\`.`;
        const replacedStr = directiveName ? message.replace(directiveName, '"@authorization"') : message;
        return new GraphQLError(`${replacedStr} ${locationStr}`);
    }
    // argument type rules
    const [argumentNode, directiveNode] = nodes as [ArgumentNode, DirectiveNode];
    const directiveName = directiveNode.name.value;
    const argumentName = argumentNode.name.value;
    const typename = directiveName.split("Authorization")[0] || "";
    const locationStr = `Location: Directive "@authorization" on type \`${typename}\`.`;
    const mysteryTypeRegex = /"(.+?)Authorization(.+?)"/g; // real-life situations
    const otherMysteryTypeRegex = /type (\\?".+?\\?")/g; // works also for rule tests which do not follow real-life Authorization directive usage
    const res = otherMysteryTypeRegex.exec(message);
    if (!res) {
        return new GraphQLError(`${message} ${locationStr}`);
    }
    const mysteryType = res[1];
    const replacedStr = mysteryType ? message.replace(mysteryType, `in argument ${argumentName}`) : message;

    return new GraphQLError(`${replacedStr} ${locationStr}`);
}
