/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { DirectiveNode } from "graphql";
import type { Annotations } from "../annotation/Annotation";
import { annotationsParsers } from "../annotation/Annotation";

export function parseAnnotations(directives: readonly DirectiveNode[]): Partial<Annotations> {
    const groupedDirectives = new Map<string, DirectiveNode[]>();
    for (const directive of directives) {
        const directivesOfName = groupedDirectives.get(directive.name.value) ?? [];
        groupedDirectives.set(directive.name.value, [...directivesOfName, directive]);
    }

    const result: Partial<Annotations> = {};
    for (const [name, parser] of Object.entries(annotationsParsers)) {
        const relevantDirectives = groupedDirectives.get(name) ?? [];
        const firstDirective = relevantDirectives[0];
        if (firstDirective) {
            result[name] = parser(firstDirective, relevantDirectives);
        }
    }
    return result;
}
