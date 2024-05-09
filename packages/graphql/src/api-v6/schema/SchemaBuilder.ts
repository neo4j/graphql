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

import type { GraphQLSchema } from "graphql";
import type { EnumTypeComposer, InputTypeComposer, ListComposer, ObjectTypeComposer } from "graphql-compose";
import { SchemaComposer } from "graphql-compose";

export type TypeDefinition = string | ListComposer<ObjectTypeComposer> | ObjectTypeComposer[] | ObjectTypeComposer;

export type GraphQLResolver = () => any;

export type FieldDefinition = {
    resolver?: GraphQLResolver;
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

    public createObjectType(
        name: string,
        fields?: Record<string, FieldDefinition | string | ObjectTypeComposer | ListComposer<ObjectTypeComposer>>,
        description?: string
    ): ObjectTypeComposer {
        return this.composer.createObjectTC({
            name,
            description,
            fields,
        });
    }

    public getOrCreateObjectType(
        name: string,
        fields?: Record<string, FieldDefinition | string | ObjectTypeComposer | ListComposer<ObjectTypeComposer>>,
        description?: string
    ): ObjectTypeComposer {
        return this.composer.getOrCreateOTC(name, (tc) => {
            if (fields) {
                tc.addFields(fields);
            }
            if (description) {
                tc.setDescription(description);
            }
        });
    }

    public createInputObjectType(
        name: string,
        fields: Record<string, InputTypeComposer | EnumTypeComposer | ListComposer<InputTypeComposer>>,
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

    public addFieldToType(type: ObjectTypeComposer, fields: Record<string, any>): void {
        type.addFields(fields);
    }

    public addQueryField(name: string, type: ObjectTypeComposer | string, resolver: (...args: any[]) => any): void {
        this.composer.Query.addFields({
            [name]: {
                type: type,
                resolve: resolver,
            },
        });
    }

    public getObjectType(typeName: string): ObjectTypeComposer {
        return this.composer.getOTC(typeName);
    }

    public build(): GraphQLSchema {
        return this.composer.buildSchema();
    }
}
