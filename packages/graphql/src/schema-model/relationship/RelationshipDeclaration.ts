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

import type { RelationshipNestedOperationsOption } from "../../constants";
import type { Annotations } from "../annotation/Annotation";
import type { Argument } from "../argument/Argument";
import type { Entity } from "../entity/Entity";
import type { Relationship } from "./Relationship";

export type NestedOperation = keyof typeof RelationshipNestedOperationsOption;
// "CREATE" | "UPDATE" | "DELETE" | "CONNECT" | "DISCONNECT" | "CONNECT_OR_CREATE";

export class RelationshipDeclaration {
    public readonly name: string; // name of the relationship field, e.g. friends
    public readonly args: Argument[];
    public readonly source: Entity;
    public readonly target: Entity;
    public readonly isList: boolean;
    public readonly nestedOperations: NestedOperation[];
    public readonly aggregate: boolean;
    public readonly isNullable: boolean;
    public readonly description?: string;
    public readonly annotations: Partial<Annotations>;

    public readonly relationshipImplementations: Relationship[];

    public readonly firstDeclaredInTypeName: string | undefined;

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
        annotations = {},
        relationshipImplementations,
        firstDeclaredInTypeName,
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
        annotations?: Partial<Annotations>;
        relationshipImplementations: Relationship[];
        firstDeclaredInTypeName?: string;
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
        this.annotations = annotations;
        this.relationshipImplementations = relationshipImplementations;
        this.firstDeclaredInTypeName = firstDeclaredInTypeName;
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
            annotations: this.annotations,
            relationshipImplementations: this.relationshipImplementations,
            firstDeclaredInTypeName: this.firstDeclaredInTypeName,
        });
    }
}
