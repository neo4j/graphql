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
import type { DirectiveNode, FieldDefinitionNode, ASTNode, GraphQLErrorExtensions } from "graphql";
import { GraphQLError } from "graphql";
import type { ObjectOrInterfaceWithExtensions } from "./path-parser";

export type AssertionResponse = {
    isValid: boolean;
    errorMsg?: string;
    errorPath: ReadonlyArray<string | number>;
};
export type ValidationFunction = ({
    directiveNode,
    traversedDef,
    parentDef,
}: {
    directiveNode: DirectiveNode;
    traversedDef: ObjectOrInterfaceWithExtensions | FieldDefinitionNode;
    parentDef?: ObjectOrInterfaceWithExtensions;
}) => void | undefined;

export class DocumentValidationError extends Error {
    path: string[];
    constructor(message: string, _path: string[]) {
        super(message);
        this.path = _path;
    }
}

export function assertValid(fn: () => void | undefined): AssertionResponse {
    let isValid = true;
    let errorMsg, errorPath;

    try {
        fn();
    } catch (error) {
        isValid = false;
        errorMsg = (error as DocumentValidationError).message;
        errorPath = (error as DocumentValidationError).path || [];
    }

    return { isValid, errorMsg, errorPath };
}

export function createGraphQLError({
    nodes,
    path,
    errorMsg,
    extensions,
}: {
    nodes?: ASTNode[] | readonly ASTNode[];
    path?: (string | number)[] | readonly (string | number)[];
    errorMsg?: string;
    extensions?: GraphQLErrorExtensions;
}) {
    const errorOpts = {
        nodes,
        path,
        source: undefined,
        positions: undefined,
        originalError: undefined,
        extensions,
    };

    // TODO: replace constructor to use errorOpts when dropping support for GraphQL15

    return new GraphQLError(
        errorMsg || "Error",
        errorOpts.nodes,
        errorOpts.source,
        errorOpts.positions,
        errorOpts.path,
        errorOpts.originalError,
        errorOpts.extensions
    );
}
