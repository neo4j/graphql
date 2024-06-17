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

import type {
    GraphQLInputType,
    GraphQLList,
    GraphQLNonNull,
    GraphQLObjectType,
    GraphQLScalarType,
    GraphQLSchema,
} from "graphql";
import type {
    EnumTypeComposer,
    InputTypeComposer,
    ListComposer,
    NonNullComposer,
    ObjectTypeComposer,
} from "graphql-compose";
import { SchemaComposer } from "graphql-compose";

export type TypeDefinition = string | ListComposer<ObjectTypeComposer> | ObjectTypeComposer;

type ObjectOrInputTypeComposer = ObjectTypeComposer | InputTypeComposer;

type ListOrNullComposer<T extends ObjectOrInputTypeComposer> =
    | ListComposer<T>
    | ListComposer<NonNullComposer<T>>
    | NonNullComposer<T>
    | NonNullComposer<ListComposer<T>>;

type WrappedComposer<T extends ObjectOrInputTypeComposer> = T | ListOrNullComposer<T>;

export type GraphQLResolver = (...args) => any;

export type FieldDefinition = {
    resolve?: GraphQLResolver;
    type: TypeDefinition;
    args?: Record<string, any>;
    deprecationReason?: string | null;
    description?: string | null;
};

export class SchemaBuilder {
    private composer: SchemaComposer;

    constructor() {
        this.composer = new SchemaComposer();
    }

    public createScalar(scalar: GraphQLScalarType): void {
        this.composer.createScalarTC(scalar);
    }

    public createObject(object: GraphQLObjectType): void {
        this.composer.createObjectTC(object);
    }

    public getOrCreateObjectType(
        name: string,
        onCreate: () => {
            fields: Record<string, FieldDefinition | string | WrappedComposer<ObjectTypeComposer>>;
            description?: string;
        }
    ): ObjectTypeComposer {
        return this.composer.getOrCreateOTC(name, (tc) => {
            const { fields, description } = onCreate();
            if (fields) {
                tc.addFields(fields);
            }
            if (description) {
                tc.setDescription(description);
            }
        });
    }

    public getOrCreateInputType(
        name: string,
        onCreate: (itc: InputTypeComposer) => {
            fields: Record<
                string,
                | EnumTypeComposer
                | string
                | GraphQLInputType
                | GraphQLList<any>
                | GraphQLNonNull<any>
                | WrappedComposer<InputTypeComposer>
            >;
            description?: string;
        }
    ): InputTypeComposer {
        return this.composer.getOrCreateITC(name, (itc) => {
            const { fields, description } = onCreate(itc);
            if (fields) {
                itc.addFields(fields);
            }
            if (description) {
                itc.setDescription(description);
            }
        });
    }

    public createInputObjectType(
        name: string,
        fields: Record<string, EnumTypeComposer | string | WrappedComposer<InputTypeComposer>>,
        description?: string
    ): InputTypeComposer {
        return this.composer.createInputTC({
            name,
            description,
            fields,
        });
    }

    public createEnumType(name: string, values: string[], description?: string): EnumTypeComposer {
        const enumValuesFormatted: Record<string, any> = values.reduce((acc, value) => {
            acc[value] = { value };
            return acc;
        }, {});
        return this.composer.createEnumTC({
            name,
            description,
            values: enumValuesFormatted,
        });
    }

    public addQueryField({
        name,
        type,
        args,
        resolver,
    }: {
        name: string;
        type: ObjectTypeComposer;
        args: Record<string, InputTypeComposer>;
        resolver: (...args: any[]) => any;
    }): void {
        this.composer.Query.addFields({
            [name]: {
                type: type,
                args,
                resolve: resolver,
            },
        });
    }

    public build(): GraphQLSchema {
        return this.composer.buildSchema();
    }
}
