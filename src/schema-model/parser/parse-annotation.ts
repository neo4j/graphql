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
