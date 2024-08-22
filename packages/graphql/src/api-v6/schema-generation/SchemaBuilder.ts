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

import type { GraphQLInputType, GraphQLNonNull, GraphQLObjectType, GraphQLScalarType, GraphQLSchema } from "graphql";
import type {
    EnumTypeComposer,
    InputTypeComposer,
    InterfaceTypeComposer,
    ListComposer,
    NonNullComposer,
    ObjectTypeComposer,
    ScalarTypeComposer,
} from "graphql-compose";
import { SchemaComposer } from "graphql-compose";
import { SchemaBuilderTypes } from "./SchemaBuilderTypes";

export type TypeDefinition = string | WrappedComposer<ObjectTypeComposer | ScalarTypeComposer>;
export type InputTypeDefinition = string | WrappedComposer<InputTypeComposer | ScalarTypeComposer>;

type ObjectOrInputTypeComposer = ObjectTypeComposer | InputTypeComposer;

type ListOrNullComposer<T extends ObjectOrInputTypeComposer | ScalarTypeComposer> =
    | ListComposer<T>
    | ListComposer<NonNullComposer<T>>
    | NonNullComposer<T>
    | NonNullComposer<ListComposer<T>>
    | NonNullComposer<ListComposer<NonNullComposer<T>>>;

export type WrappedComposer<T extends ObjectOrInputTypeComposer | ScalarTypeComposer> = T | ListOrNullComposer<T>;

export type GraphQLResolver = (...args) => any;

export type FieldDefinition = {
    resolve?: GraphQLResolver;
    type: TypeDefinition;
    args?: Record<string, any>;
    deprecationReason?: string | null;
    description?: string | null;
};

export type InputFieldDefinition = {
    type: InputTypeDefinition;
    args?: Record<string, any>;
    deprecationReason?: string | null;
    description?: string | null;
    defaultValue?: any;
};

export class SchemaBuilder {
    public readonly types: SchemaBuilderTypes;
    private composer: SchemaComposer;

    constructor() {
        this.composer = new SchemaComposer();
        this.types = new SchemaBuilderTypes(this.composer);
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
            fields: Record<string, FieldDefinition | WrappedComposer<ObjectTypeComposer | ScalarTypeComposer>>;
            description?: string;
            iface?: InterfaceTypeComposer;
        }
    ): ObjectTypeComposer {
        return this.composer.getOrCreateOTC(name, (tc) => {
            const { fields, description, iface } = onCreate();
            if (fields) {
                tc.addFields(fields);
            }
            if (description) {
                tc.setDescription(description);
            }
            if (iface) {
                tc.addInterface(iface);
            }
        });
    }

    public getOrCreateInterfaceType(
        name: string,
        onCreate: () => {
            fields: Record<string, FieldDefinition | WrappedComposer<ObjectTypeComposer | ScalarTypeComposer>>;
            description?: string;
        }
    ): InterfaceTypeComposer {
        return this.composer.getOrCreateIFTC(name, (tc) => {
            const { fields, description } = onCreate();

            if (fields) {
                tc.addFields(fields);
            }
            if (description) {
                tc.setDescription(description);
            }
            // This is used for global node, not sure if needed for other interfaces
            tc.setResolveType((obj) => {
                return obj.__resolveType;
            });
        });
    }

    public getOrCreateInputType(
        name: string,
        onCreate: (itc: InputTypeComposer) => {
            fields: Record<
                string,
                | EnumTypeComposer
                | GraphQLInputType
                | GraphQLNonNull<any>
                | WrappedComposer<InputTypeComposer | ScalarTypeComposer>
                | InputFieldDefinition
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
        fields: Record<
            string,
            | EnumTypeComposer
            | GraphQLInputType
            | GraphQLNonNull<any>
            | WrappedComposer<InputTypeComposer | ScalarTypeComposer>
            | InputFieldDefinition
        >,
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
        description,
    }: {
        name: string;
        type: ObjectTypeComposer | InterfaceTypeComposer;
        args: Record<string, InputTypeComposer | WrappedComposer<ScalarTypeComposer>>;
        resolver: (...args: any[]) => any;
        description?: string;
    }): void {
        this.composer.Query.addFields({
            [name]: {
                type: type,
                args,
                resolve: resolver,
                description,
            },
        });
    }

    public addMutationField({
        name,
        type,
        args,
        resolver,
        description,
    }: {
        name: string;
        type: ObjectTypeComposer | InterfaceTypeComposer;
        args: Record<string, WrappedComposer<InputTypeComposer | ScalarTypeComposer>>;
        resolver: (...args: any[]) => any;
        description?: string;
    }): void {
        this.composer.Mutation.addFields({
            [name]: {
                type: type,
                args,
                resolve: resolver,
                description,
            },
        });
    }

    public build(): GraphQLSchema {
        return this.composer.buildSchema();
    }
}
