/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */
import type { DirectiveNode } from "graphql";
import { selectableDirective } from "../../../graphql/directives";
import { SelectableAnnotation } from "../../annotation/SelectableAnnotation";
import { parseArguments } from "../parse-arguments";

export function parseSelectableAnnotation(directive: DirectiveNode): SelectableAnnotation {
    const { onRead, onAggregate } = parseArguments<{
        onRead: boolean;
        onAggregate: boolean;
    }>(selectableDirective, directive);

    return new SelectableAnnotation({
        onRead,
        onAggregate,
    });
}
