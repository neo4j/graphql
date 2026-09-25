/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { Maybe } from "@graphql-tools/utils";
import type { ASTVisitor, DocumentNode, GraphQLError, GraphQLSchema } from "graphql";
import { visit, visitInParallel } from "graphql";
import type { SDLValidationContext } from "graphql/validation/ValidationContext";
import type { Neo4jGraphQLCallbacks, Neo4jVectorSettings } from "../../types";
import { Neo4jValidationContext } from "./Neo4jValidationContext";
import { mapError } from "./utils/map-error";

type Neo4jValidationRule = <T extends SDLValidationContext>(context: T) => ASTVisitor;

export function validateSDL(
    documentAST: DocumentNode,
    rules: ReadonlyArray<Neo4jValidationRule>,
    schemaToExtend?: Maybe<GraphQLSchema>,
    callbacks?: Neo4jGraphQLCallbacks,
    vectors?: Neo4jVectorSettings
): ReadonlyArray<GraphQLError> {
    const errors: Array<GraphQLError> = [];
    const context = new Neo4jValidationContext(
        documentAST,
        schemaToExtend,
        (error) => {
            const mappedError = mapError(error);
            errors.push(mappedError);
        },
        callbacks,
        vectors
    );
    const visitors = rules.map((rule) => rule(context));
    visit(documentAST, visitInParallel(visitors));
    return errors;
}
