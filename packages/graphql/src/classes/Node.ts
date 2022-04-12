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
import camelcase from "camelcase";
import pluralize from "pluralize";
import type {
    Auth,
    ConnectionField,
    Context,
    CustomEnumField,
    CustomScalarField,
    CypherField,
    FullText,
    ComputedField,
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
import { QueryOptionsDirective } from "./QueryOptionsDirective";
import { upperFirst } from "../utils/upper-first";

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
    computedFields: ComputedField[];
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

type ConstrainableField = PrimitiveField | CustomScalarField | CustomEnumField | TemporalField | PointField;

export type RootTypeFieldNames = {
    create: string;
    read: string;
    update: string;
    delete: string;
    aggregate: string;
    subscribe: {
        created: string;
        updated: string;
        deleted: string;
    };
};

export type AggregateTypeNames = {
    selection: string;
    input: string;
};

export type MutationResponseTypeNames = {
    create: string;
    update: string;
};

export type SubscriptionEvents = {
    create: string;
    update: string;
    delete: string;
};

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
    public singular: string;
    public plural: string;

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
        this.singular = this.generateSingular();
        this.plural = this.generatePlural();
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
        return [
            ...this.primitiveFields,
            ...this.scalarFields,
            ...this.enumFields,
            ...this.temporalFields,
            ...this.pointFields,
        ];
    }

    public get uniqueFields(): ConstrainableField[] {
        return this.constrainableFields.filter((field) => field.unique);
    }

    private get pascalCaseSingular(): string {
        return upperFirst(this.singular);
    }

    private get pascalCasePlural(): string {
        return upperFirst(this.plural);
    }

    public get rootTypeFieldNames(): RootTypeFieldNames {
        const pascalCasePlural = this.pascalCasePlural;

        return {
            create: `create${pascalCasePlural}`,
            read: this.plural,
            update: `update${pascalCasePlural}`,
            delete: `delete${pascalCasePlural}`,
            aggregate: `${this.plural}Aggregate`,
            subscribe: {
                created: `${this.singular}Created`,
                updated: `${this.singular}Updated`,
                deleted: `${this.singular}Deleted`,
            },
        };
    }

    public get aggregateTypeNames(): AggregateTypeNames {
        return {
            selection: `${this.name}AggregateSelection`,
            input: `${this.name}AggregateSelectionInput`,
        };
    }

    public get mutationResponseTypeNames(): MutationResponseTypeNames {
        const pascalCasePlural = this.pascalCasePlural;

        return {
            create: `Create${pascalCasePlural}MutationResponse`,
            update: `Update${pascalCasePlural}MutationResponse`,
        };
    }

    public get subscriptionEventTypeNames(): SubscriptionEvents {
        const pascalCaseSingular = this.pascalCaseSingular;

        return {
            create: `${pascalCaseSingular}CreatedEvent`,
            update: `${pascalCaseSingular}UpdatedEvent`,
            delete: `${pascalCaseSingular}DeletedEvent`,
        };
    }

    public get subscriptionEventPayloadFieldNames(): SubscriptionEvents {
        const pascalCaseSingular = this.pascalCaseSingular;

        return {
            create: `created${pascalCaseSingular}`,
            update: `updated${pascalCaseSingular}`,
            delete: `deleted${pascalCaseSingular}`,
        };
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

    private generateSingular(): string {
        const singular = camelcase(this.name);

        return `${this.leadingUnderscores(this.name)}${singular}`;
    }

    private generatePlural(): string {
        const name = this.nodeDirective?.plural || this.name;
        const plural = this.nodeDirective?.plural ? camelcase(name) : pluralize(camelcase(name));

        return `${this.leadingUnderscores(name)}${plural}`;
    }

    private leadingUnderscores(name: string): string {
        const re = /^(_+).+/;
        const match = re.exec(name);
        return match?.[1] || "";
    }
}

export default Node;
