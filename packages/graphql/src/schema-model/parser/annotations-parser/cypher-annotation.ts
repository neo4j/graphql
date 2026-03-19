/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */
import type { DirectiveNode } from "graphql";
import { Neo4jGraphQLSchemaValidationError } from "../../../classes";
import { cypherDirective } from "../../../graphql/directives";
import { CypherAnnotation } from "../../annotation/CypherAnnotation";
import { parseArguments } from "../parse-arguments";

export function parseCypherAnnotation(directive: DirectiveNode): CypherAnnotation {
    const { statement, columnName } = parseArguments(cypherDirective, directive);
    if (!statement || typeof statement !== "string") {
        throw new Neo4jGraphQLSchemaValidationError("@cypher statement required");
    }
    if (!columnName || typeof columnName !== "string") {
        throw new Neo4jGraphQLSchemaValidationError("@cypher columnName required");
    }
    return new CypherAnnotation({
        statement: statement,
        columnName: columnName,
    });
}
