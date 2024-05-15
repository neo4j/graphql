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

import camelcase from "camelcase";
import type { DirectiveNode, NamedTypeNode } from "graphql";
import pluralize from "pluralize";
import type {
    ConnectionField,
    CustomEnumField,
    CustomScalarField,
    CypherField,
    FullText,
    InterfaceField,
    ObjectField,
    PointField,
    PrimitiveField,
    RelationField,
    TemporalField,
    UnionField,
} from "../types";
import type { Neo4jGraphQLContext } from "../types/neo4j-graphql-context";
import type { DecodedGlobalId } from "../utils/global-ids";
import { fromGlobalId, toGlobalId } from "../utils/global-ids";
import { leadingUnderscores } from "../utils/leading-underscore";
import { upperFirst } from "../utils/upper-first";
import type { GraphElementConstructor } from "./GraphElement";
import { GraphElement } from "./GraphElement";
import type { LimitDirective } from "./LimitDirective";
import type { NodeDirective } from "./NodeDirective";

export interface NodeConstructor extends GraphElementConstructor {
    name: string;
    relationFields: RelationField[];
    connectionFields: ConnectionField[];
    cypherFields: CypherField[];
    primitiveFields: PrimitiveField[];
    scalarFields: CustomScalarField[];
    enumFields: CustomEnumField[];
    otherDirectives: DirectiveNode[];
    propagatedDirectives: DirectiveNode[];
    unionFields: UnionField[];
    interfaceFields: InterfaceField[];
    interfaces: NamedTypeNode[];
    objectFields: ObjectField[];
    temporalFields: TemporalField[];
    pointFields: PointField[];
    plural?: string;
    fulltextDirective?: FullText;
    nodeDirective?: NodeDirective;
    description?: string;
    limitDirective?: LimitDirective;
    isGlobalNode?: boolean;
    globalIdField?: string;
    globalIdFieldIsInt?: boolean;
}

type MutableField = PrimitiveField | CustomScalarField | CustomEnumField | UnionField | TemporalField | CypherField;

type AuthableField = PrimitiveField | CustomScalarField | CustomEnumField | UnionField | TemporalField | CypherField;

type ConstrainableField = PrimitiveField | CustomScalarField | CustomEnumField | TemporalField;

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
        relationship_created: string;
        relationship_deleted: string;
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
    create_relationship: string;
    delete_relationship: string;
};

class Node extends GraphElement {
    public relationFields: RelationField[];
    public connectionFields: ConnectionField[];
    public cypherFields: CypherField[];
    public otherDirectives: DirectiveNode[];
    public propagatedDirectives: DirectiveNode[];
    public unionFields: UnionField[];
    public interfaceFields: InterfaceField[];
    public interfaces: NamedTypeNode[];
    public objectFields: ObjectField[];
    public nodeDirective?: NodeDirective;
    public fulltextDirective?: FullText;
    public description?: string;
    public limit?: LimitDirective;
    public singular: string;
    public plural: string;
    public isGlobalNode: boolean | undefined;
    private _idField: string | undefined;
    private _idFieldIsInt?: boolean;

    constructor(input: NodeConstructor) {
        super(input);
        this.relationFields = input.relationFields;
        this.connectionFields = input.connectionFields;
        this.cypherFields = input.cypherFields;
        this.otherDirectives = input.otherDirectives;
        this.propagatedDirectives = input.propagatedDirectives;
        this.unionFields = input.unionFields;
        this.interfaceFields = input.interfaceFields;
        this.interfaces = input.interfaces;
        this.objectFields = input.objectFields;
        this.nodeDirective = input.nodeDirective;
        this.fulltextDirective = input.fulltextDirective;
        this.limit = input.limitDirective;
        this.isGlobalNode = input.isGlobalNode;
        this._idField = input.globalIdField;
        this._idFieldIsInt = input.globalIdFieldIsInt;
        this.singular = this.generateSingular();
        this.plural = this.generatePlural(input.plural);
    }

    // Fields you can set in a create or update mutation
    public get mutableFields(): MutableField[] {
        return [
            ...this.temporalFields,
            ...this.enumFields,
            ...this.objectFields,
            ...this.scalarFields, // these are just custom scalars
            ...this.primitiveFields, // these are instead built-in scalars
            ...this.interfaceFields,
            ...this.objectFields,
            ...this.unionFields,
            ...this.pointFields,
        ];
    }

    /** Fields you can apply auth allow and bind to */
    // Maybe we can remove this as they may not be used anymore in the new auth system
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
                relationship_created: `${this.singular}RelationshipCreated`,
                relationship_deleted: `${this.singular}RelationshipDeleted`,
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
            create_relationship: `${pascalCaseSingular}RelationshipCreatedEvent`,
            delete_relationship: `${pascalCaseSingular}RelationshipDeletedEvent`,
        };
    }

    public get subscriptionEventPayloadFieldNames(): SubscriptionEvents {
        const pascalCaseSingular = this.pascalCaseSingular;

        return {
            create: `created${pascalCaseSingular}`,
            update: `updated${pascalCaseSingular}`,
            delete: `deleted${pascalCaseSingular}`,
            create_relationship: `${this.singular}`,
            delete_relationship: `${this.singular}`,
        };
    }

    public getLabelString(context: Neo4jGraphQLContext): string {
        return this.nodeDirective?.getLabelsString(this.name, context) || `:${this.name}`;
    }
    /**
     * Returns the list containing labels mapped with the values contained in the Context.
     * Be careful when using this method, labels returned are unescaped.
     **/
    public getLabels(context: Neo4jGraphQLContext): string[] {
        return this.nodeDirective?.getLabels(this.name, context) || [this.name];
    }

    public getMainLabel(): string {
        return this.nodeDirective?.labels?.[0] || this.name;
    }

    public getAllLabels(): string[] {
        return this.nodeDirective?.labels || [this.name];
    }

    public getGlobalIdField(): string {
        if (!this.isGlobalNode || !this._idField) {
            throw new Error(
                "The 'global' property needs to be set to true on an @id directive before accessing the unique node id field"
            );
        }
        return this._idField;
    }

    public toGlobalId(id: string): string {
        const typeName = this.name;
        const field = this.getGlobalIdField();
        return toGlobalId({ typeName, field, id });
    }

    public fromGlobalId(relayId: string): DecodedGlobalId {
        return fromGlobalId(relayId, this._idFieldIsInt);
    }

    private generateSingular(): string {
        const singular = camelcase(this.name);

        return `${leadingUnderscores(this.name)}${singular}`;
    }

    private generatePlural(inputPlural: string | undefined): string {
        const name = inputPlural || this.plural || this.name;
        const plural = inputPlural || this.plural ? camelcase(name) : pluralize(camelcase(name));

        return `${leadingUnderscores(name)}${plural}`;
    }
}

export default Node;
