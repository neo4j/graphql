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

import type { ArgumentNode, DirectiveNode, GraphQLError } from "graphql";
import { VALIDATION_ERROR_CODES } from "./validation-error-codes";
import { lowerFirst } from "../../../utils/lower-first";
import { createGraphQLError } from "../custom-rules/utils/document-validation-error";

export function mapError(error: GraphQLError): GraphQLError {
    const { nodes, message } = error;

    if (isCustomRule(error)) {
        return mapCustomRuleError(error);
    }
    const replacedMessage = renameMysteryDirective(message);
    if (!replacedMessage) {
        return error;
    }
    return createGraphQLError({
        nodes,
        errorMsg: replacedMessage,
    });
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
        return createGraphQLError({
            path,
            errorMsg: replacedMessage,
        });
    }

    replacedMessage = eraseMysteryType(message);
    if (replacedMessage) {
        return createGraphQLError({
            path,
            errorMsg: replacedMessage,
        });
    }
    return error;
}

const RENAMED_DIRECTIVE_OR_TYPE = /(\s?"([^\s]*?([sS]ubscriptionsAuthorization|Authorization|Authentication)[^\s]*?)")/;
const WHERE_TYPE = /type(\s\\?".+?\\?")/; // <typename>Where / JwtPayloadWhere
const JWT_PAYLOAD_DUMMY_VALUE_ERROR =
    /(?:(?:String)|(?:Int)|(?:Float)|(?:Boolean))(?: cannot represent a?\s?)(?:(?:non string)|(?:non-integer)|(?:non numeric)|(?:non boolean))(?: value)(:.+)/;
function composeRegex(predicate: string, ...regexes: RegExp[]) {
    return new RegExp(regexes.map((r) => r.source).join(predicate));
}

/**
 * Renames type-dependent directives generated for the validation schema to their standard equivalent.
 * eg. `@UserAuthorization` -> `@authorization`
 */
function renameMysteryDirective(initialMessage: string): string | undefined {
    const renamedDirectiveMatch = RENAMED_DIRECTIVE_OR_TYPE.exec(initialMessage);
    if (!renamedDirectiveMatch) {
        return;
    }
    const [, , renamedDirectiveName, directiveName] = renamedDirectiveMatch;
    if (!renamedDirectiveName || !directiveName) {
        return;
    }
    return initialMessage.replace(renamedDirectiveName, `@${lowerFirst(directiveName)}`);
}

/**
 * Deletes references to types that only exist in the validation schema.
 * eg. `UserAuthorizationValidationRule`
 */
function eraseMysteryType(initialMessage: string): string | undefined {
    const mysteryTypeRegex = composeRegex("|", RENAMED_DIRECTIVE_OR_TYPE, WHERE_TYPE);
    const mysteryTypeMatch = mysteryTypeRegex.exec(initialMessage);
    if (!mysteryTypeMatch) {
        return;
    }
    // 1st capture group in any of the 2 regexes,
    // or the 4th capture group in the case of RENAMED_DIRECTIVE_OR_TYPE.
    const mysteryType = mysteryTypeMatch[1] || mysteryTypeMatch[4];
    if (!mysteryType) {
        return;
    }
    return initialMessage.replace(mysteryType, "");
}

/**
 * Deletes references to dummy values of the underlying type of the JWT claim that replace the "$jwt." value in the validation schema.
 * This is done to correctly assert the types, as "$jwt." will always be a string regardless of the underlying type of the JWT claim.
 */
function eraseDummyJWTValue(initialMessage: string): string | undefined {
    const isTypeErrorContainingDummyValue = JWT_PAYLOAD_DUMMY_VALUE_ERROR.exec(initialMessage);
    if (!isTypeErrorContainingDummyValue || !isTypeErrorContainingDummyValue[1]) {
        return;
    }
    const dummyValue = isTypeErrorContainingDummyValue[1];
    return initialMessage.replace(dummyValue, ".");
}
