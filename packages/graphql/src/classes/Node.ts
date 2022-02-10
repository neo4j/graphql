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

import { DirectiveNode, NamedTypeNode } from "graphql";
import pluralize from "pluralize";
import type {
    Auth,
    ConnectionField,
    Context,
    CustomEnumField,
    CustomScalarField,
    CypherField,
    FullText,
    IgnoredField,
    InterfaceField,
    ObjectField,
    PointField,
    PrimitiveField,
    RelationField,
    TemporalField,
    UnionField,
} from "../types";
import Exclude from "./Exclude";
import { GraphElement, GraphElementConstructor } from "./GraphElement";
import { NodeDirective } from "./NodeDirective";
import { lowerFirst } from "../utils/lower-first";
import { QueryOptionsDirective } from "./QueryOptionsDirective";

export interface NodeConstructor extends GraphElementConstructor {
    name: string;
    relationFields: RelationField[];
    connectionFields: ConnectionField[];
    cypherFields: CypherField[];
    primitiveFields: PrimitiveField[];
    scalarFields: CustomScalarField[];
    enumFields: CustomEnumField[];
    otherDirectives: DirectiveNode[];
    unionFields: UnionField[];
    interfaceFields: InterfaceField[];
    interfaces: NamedTypeNode[];
    objectFields: ObjectField[];
    temporalFields: TemporalField[];
    pointFields: PointField[];
    ignoredFields: IgnoredField[];
    auth?: Auth;
    fulltextDirective?: FullText;
    exclude?: Exclude;
    nodeDirective?: NodeDirective;
    description?: string;
    queryOptionsDirective?: QueryOptionsDirective;
}

type MutableField =
    | PrimitiveField
    | CustomScalarField
    | CustomEnumField
    | UnionField
    | ObjectField
    | TemporalField
    | PointField
    | CypherField;

type AuthableField =
    | PrimitiveField
    | CustomScalarField
    | CustomEnumField
    | UnionField
    | ObjectField
    | TemporalField
    | PointField
    | CypherField;

type ConstrainableField = PrimitiveField | TemporalField | PointField;

class Node extends GraphElement {
    public relationFields: RelationField[];
    public connectionFields: ConnectionField[];
    public cypherFields: CypherField[];
    public otherDirectives: DirectiveNode[];
    public unionFields: UnionField[];
    public interfaceFields: InterfaceField[];
    public interfaces: NamedTypeNode[];
    public objectFields: ObjectField[];
    public exclude?: Exclude;
    public nodeDirective?: NodeDirective;
    public fulltextDirective?: FullText;
    public auth?: Auth;
    public description?: string;
    public queryOptions?: QueryOptionsDirective;

    constructor(input: NodeConstructor) {
        super(input);
        this.relationFields = input.relationFields;
        this.connectionFields = input.connectionFields;
        this.cypherFields = input.cypherFields;
        this.otherDirectives = input.otherDirectives;
        this.unionFields = input.unionFields;
        this.interfaceFields = input.interfaceFields;
        this.interfaces = input.interfaces;
        this.objectFields = input.objectFields;
        this.exclude = input.exclude;
        this.nodeDirective = input.nodeDirective;
        this.fulltextDirective = input.fulltextDirective;
        this.auth = input.auth;
        this.queryOptions = input.queryOptionsDirective;
    }

    // Fields you can set in a create or update mutation
    public get mutableFields(): MutableField[] {
        return [
            ...this.temporalFields,
            ...this.enumFields,
            ...this.objectFields,
            ...this.scalarFields,
            ...this.primitiveFields,
            ...this.interfaceFields,
            ...this.objectFields,
            ...this.unionFields,
            ...this.pointFields,
        ];
    }

    /** Fields you can apply auth allow and bind to */
    public get authableFields(): AuthableField[] {
        return [
            ...this.primitiveFields,
            ...this.scalarFields,
            ...this.enumFields,
            ...this.unionFields,
            ...this.objectFields,
            ...this.temporalFields,
            ...this.pointFields,
            ...this.cypherFields,
        ];
    }

    public get constrainableFields(): ConstrainableField[] {
        return [...this.primitiveFields, ...this.temporalFields, ...this.pointFields];
    }

    public get uniqueFields(): ConstrainableField[] {
        return this.constrainableFields.filter((field) => field.unique);
    }

    public get plural(): string {
        const pluralValue = this.nodeDirective?.plural ? this.nodeDirective.plural : pluralize(this.name);
        return lowerFirst(pluralValue);
    }

    public getLabelString(context: Context): string {
        return this.nodeDirective?.getLabelsString(this.name, context) || `:${this.name}`;
    }

    public getLabels(context: Context): string[] {
        return this.nodeDirective?.getLabels(this.name, context) || [this.name];
    }

    public getMainLabel(): string {
        return this.nodeDirective?.label || this.name;
    }
}

export default Node;
