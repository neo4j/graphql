/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */
import type { DirectiveNode } from "graphql";
import { settableDirective } from "../../../graphql/directives";
import { SettableAnnotation } from "../../annotation/SettableAnnotation";
import { parseArguments } from "../parse-arguments";

export function parseSettableAnnotation(directive: DirectiveNode): SettableAnnotation {
    const { onCreate, onUpdate } = parseArguments<{
        onCreate: boolean;
        onUpdate: boolean;
    }>(settableDirective, directive);

    return new SettableAnnotation({
        onCreate,
        onUpdate,
    });
}
