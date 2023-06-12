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

import type { ArgumentNode, DirectiveNode } from "graphql";
import { GraphQLError } from "graphql";
import { VALIDATION_ERROR_CODES } from "./validation-error-codes";

export function mapError(error: GraphQLError): GraphQLError {
    const { nodes, message } = error;

    if (isCustomRule(error)) {
        return mapCustomRuleError(error);
    }
    const replacedMessage = renameMysteryDirective(message);
    if (!replacedMessage) {
        return error;
    }
    return new GraphQLError(replacedMessage, { nodes });
}

function isCustomRule(error: GraphQLError): boolean {
    const { extensions } = error;
    return !!(
        extensions &&
        extensions["exception"] &&
        Object.keys(extensions.exception).length &&
        extensions.exception["code"] &&
        Object.values(VALIDATION_ERROR_CODES).includes(extensions.exception["code"])
    );
}

function mapCustomRuleError(error: GraphQLError): GraphQLError {
    const { nodes, message, path } = error;
    const [argumentNode, directiveNode] = nodes as [ArgumentNode, DirectiveNode];
    if (!argumentNode && !directiveNode) {
        return error;
    }
    let replacedMessage: string | undefined = undefined;
    replacedMessage = eraseDummyJWTValue(message);
    if (replacedMessage) {
        return new GraphQLError(replacedMessage, { path });
    }

    replacedMessage = eraseMysteryType(message);
    if (replacedMessage) {
        return new GraphQLError(replacedMessage, { path });
    }
    return error;
}

const RENAMED_DIRECTIVE_OR_TYPE = /(\s?"([^\s]*?(Authorization|Authentication)[^\s]*?)")/;
const WHERE_TYPE = /type(\s\\?".+?\\?")/; // <typename>Where / JwtPayloadWhere
const JWT_PAYLOAD_DUMMY_VALUE_ERROR =
    /(?:(?:String)|(?:Int)|(?:Float)|(?:Boolean))(?: cannot represent a?\s?)(?:(?:non string)|(?:non-integer)|(?:non numeric)|(?:non boolean))(?: value)(:.+)/;
function composeRegex(predicate: string, ...regexes: RegExp[]) {
    return new RegExp(regexes.map((r) => r.source).join(predicate));
}
function renameMysteryDirective(initialMessage: string): string | undefined {
    const renamedDirectiveMatch = RENAMED_DIRECTIVE_OR_TYPE.exec(initialMessage);
    if (!renamedDirectiveMatch) {
        return;
    }
    const [, , renamedDirectiveName, directiveName] = renamedDirectiveMatch;
    if (!renamedDirectiveName || !directiveName) {
        return;
    }
    return initialMessage.replace(renamedDirectiveName, `@${directiveName?.toLowerCase()}`);
}

function eraseMysteryType(initialMessage: string): string | undefined {
    const mysteryTypeRegex = composeRegex("|", RENAMED_DIRECTIVE_OR_TYPE, WHERE_TYPE);
    const mysteryTypeMatch = mysteryTypeRegex.exec(initialMessage);
    if (!mysteryTypeMatch) {
        return;
    }
    const mysteryType = mysteryTypeMatch[1] || mysteryTypeMatch[4];
    if (!mysteryType) {
        return;
    }
    return initialMessage.replace(mysteryType, "");
}

function eraseDummyJWTValue(initialMessage: string): string | undefined {
    const isTypeErrorContainingDummyValue = JWT_PAYLOAD_DUMMY_VALUE_ERROR.exec(initialMessage);
    if (!isTypeErrorContainingDummyValue || !isTypeErrorContainingDummyValue[1]) {
        return;
    }
    const dummyValue = isTypeErrorContainingDummyValue[1];
    return initialMessage.replace(dummyValue, ".");
}
