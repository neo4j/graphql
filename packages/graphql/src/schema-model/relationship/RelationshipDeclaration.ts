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

import { Neo4jGraphQLSchemaValidationError } from "../../classes";
import type { RelationshipNestedOperationsOption } from "../../constants";
import type { Annotation, Annotations } from "../annotation/Annotation";
import { annotationToKey } from "../annotation/Annotation";
import type { Argument } from "../argument/Argument";
import type { Entity } from "../entity/Entity";
import type { Relationship } from "./Relationship";

export type NestedOperation = keyof typeof RelationshipNestedOperationsOption;
// "CREATE" | "UPDATE" | "DELETE" | "CONNECT" | "DISCONNECT" | "CONNECT_OR_CREATE";

export class RelationshipDeclaration {
    // TODO: prune unused fields
    public readonly name: string; // name of the relationship field, e.g. friends
    public readonly args: Argument[];
    public readonly source: Entity;
    public readonly target: Entity;
    public readonly isList: boolean;
    public readonly nestedOperations: NestedOperation[];
    public readonly aggregate: boolean;
    public readonly isNullable: boolean;
    public readonly description?: string;
    public readonly annotations: Partial<Annotations> = {};

    public readonly relationshipImplementations: Relationship[];

    constructor({
        name,
        args,
        source,
        target,
        isList,
        nestedOperations,
        aggregate,
        isNullable,
        description,
        annotations = [],
        relationshipImplementations,
    }: {
        name: string;
        args: Argument[];
        source: Entity;
        target: Entity;
        isList: boolean;
        nestedOperations: NestedOperation[];
        aggregate: boolean;
        isNullable: boolean;
        description?: string;
        annotations: Annotation[];
        relationshipImplementations: Relationship[];
    }) {
        this.name = name;
        this.source = source;
        this.target = target;
        this.args = args;
        this.isList = isList;
        this.nestedOperations = nestedOperations;
        this.aggregate = aggregate;
        this.isNullable = isNullable;
        this.description = description;
        this.relationshipImplementations = relationshipImplementations;

        for (const annotation of annotations) {
            this.addAnnotation(annotation);
        }
    }

    public clone(): RelationshipDeclaration {
        return new RelationshipDeclaration({
            name: this.name,
            args: this.args,
            source: this.source,
            target: this.target,
            isList: this.isList,
            nestedOperations: this.nestedOperations,
            aggregate: this.aggregate,
            isNullable: this.isNullable,
            description: this.description,
            annotations: Object.values(this.annotations),
            relationshipImplementations: this.relationshipImplementations,
        });
    }

    private addAnnotation(annotation: Annotation): void {
        const annotationKey = annotationToKey(annotation);
        if (this.annotations[annotationKey]) {
            throw new Neo4jGraphQLSchemaValidationError(`Annotation ${annotationKey} already exists in ????`);
        }

        // We cast to any because we aren't narrowing the Annotation type here.
        // There's no reason to narrow either, since we care more about performance.
        this.annotations[annotationKey] = annotation as any;
    }

    // // TODO: Remove  connectionFieldTypename and relationshipFieldTypename and delegate to the adapter
    // /**Note: Required for now to infer the types without ResolveTree */
    // public get connectionFieldTypename(): string {
    //     return `${this.source.name}${upperFirst(this.name)}Connection`;
    // }

    // /**Note: Required for now to infer the types without ResolveTree */
    // public get relationshipFieldTypename(): string {
    //     return `${this.source.name}${upperFirst(this.name)}Relationship`;
    // }
}
