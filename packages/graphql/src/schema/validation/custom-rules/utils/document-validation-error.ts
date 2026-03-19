/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */
import type { ASTNode, DirectiveNode, FieldDefinitionNode, GraphQLErrorExtensions } from "graphql";
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
