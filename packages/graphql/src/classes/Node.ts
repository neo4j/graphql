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
import camelCase from "camelcase";
import pluralize from "pluralize";
import type {
    RelationField,
    ConnectionField,
    CypherField,
    PrimitiveField,
    CustomEnumField,
    CustomScalarField,
    UnionField,
    InterfaceField,
    ObjectField,
    TemporalField,
    PointField,
    Auth,
    BaseField,
} from "../types";
import Exclude from "./Exclude";
import NodeDirective from "./NodeDirective";
import { GraphElement, GraphElementConstructor } from "./GraphElement";

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
    ignoredFields: BaseField[];
    auth?: Auth;
    exclude?: Exclude;
    nodeDirective?: NodeDirective;
    description?: string;
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
    public auth?: Auth;
    public description?: string;

    /**
     * Fields you can apply auth allow and bind to
     */
    public authableFields: (
        | PrimitiveField
        | CustomScalarField
        | CustomEnumField
        | UnionField
        | ObjectField
        | TemporalField
        | PointField
        | CypherField
    )[];

    /**
     * Fields you can set in a create or update mutation
     */
    public mutableFields: (
        | PrimitiveField
        | CustomScalarField
        | CustomEnumField
        | UnionField
        | ObjectField
        | TemporalField
        | PointField
    )[];

    /**
     * Fields you can sort on
     */
    public sortableFields: (
        | PrimitiveField
        | CustomScalarField
        | CustomEnumField
        | TemporalField
        | PointField
        | CypherField
    )[];

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
        this.auth = input.auth;
        this.description = input.description;

        this.authableFields = [
            ...input.primitiveFields,
            ...input.scalarFields,
            ...input.enumFields,
            ...input.unionFields,
            ...input.objectFields,
            ...input.temporalFields,
            ...input.pointFields,
            ...input.cypherFields,
        ];

        this.mutableFields = [
            ...input.temporalFields,
            ...input.enumFields,
            ...input.objectFields,
            ...input.scalarFields,
            ...input.primitiveFields,
            ...input.interfaceFields,
            ...input.objectFields,
            ...input.unionFields,
            ...input.pointFields,
        ];

        this.sortableFields = [
            ...input.primitiveFields,
            ...input.scalarFields,
            ...input.enumFields,
            ...input.temporalFields,
            ...input.pointFields,
            ...input.cypherFields.filter((field) =>
                [
                    "Boolean",
                    "ID",
                    "Int",
                    "BigInt",
                    "Float",
                    "String",
                    "DateTime",
                    "LocalDateTime",
                    "Time",
                    "LocalTime",
                    "Date",
                    "Duration",
                ].includes(field.typeMeta.name)
            ),
        ].filter((field) => !field.typeMeta.array);
    }

    public get labelString(): string {
        return this.nodeDirective?.getLabelsString(this.name) || `:${this.name}`;
    }

    public get labels(): string[] {
        return this.nodeDirective?.getLabels(this.name) || [this.name];
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

    // Fields you can apply auth allow and bind to
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

    public getPlural(options: { camelCase: boolean }): string {
        // camelCase is optional in this case to maintain backward compatibility
        if (this.nodeDirective?.plural) {
            return options.camelCase ? camelCase(this.nodeDirective.plural) : this.nodeDirective.plural;
        }
        return pluralize(options.camelCase ? camelCase(this.name) : this.name);
    }
}

export default Node;
