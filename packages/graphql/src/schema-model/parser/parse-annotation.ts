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
import type { Annotation } from "../annotation/Annotation";
import { annotationsParsers } from "../annotation/Annotation";

export function parseAnnotations(directives: readonly DirectiveNode[]): Annotation[] {
    const annotations = directives.reduce((directivesMap, directive) => {
        if (directivesMap.has(directive.name.value)) {
            // TODO: takes the first one
            // multiple interfaces can have this annotation - must constrain this flexibility by design
            return directivesMap;
        }
        const annotation = annotationsParsers[directive.name.value]?.(
            directive,
            directives.filter((other) => other.name.value === directive.name.value)
        );
        if (annotation) {
            directivesMap.set(directive.name.value, annotation);
        }
        return directivesMap;
    }, new Map<string, Annotation>());
    return Array.from(annotations.values());
}
