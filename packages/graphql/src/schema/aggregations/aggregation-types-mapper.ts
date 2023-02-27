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

import type { ObjectTypeComposer, SchemaComposer } from "graphql-compose";
import type { Subgraph } from "../../classes/Subgraph";
import { idResolver } from "../resolvers/field/id";
import { numericalResolver } from "../resolvers/field/numerical";

export class AggregationTypesMapper {
    private requiredAggregationSelectionTypes: Record<string, ObjectTypeComposer<unknown, unknown>>;
    private nullableAggregationSelectionTypes: Record<string, ObjectTypeComposer<unknown, unknown>>;

    private subgraph: Subgraph | undefined;

    constructor(composer: SchemaComposer, subgraph?: Subgraph) {
        this.subgraph = subgraph;
        this.requiredAggregationSelectionTypes = this.getOrCreateAggregationSelectionTypes({
            composer,
            nullable: false,
        });
        this.nullableAggregationSelectionTypes = this.getOrCreateAggregationSelectionTypes({
            composer,
            nullable: true,
        });
    }

    public getAggregationType({
        fieldName,
        nullable,
    }: {
        fieldName: string;
        nullable: boolean;
    }): ObjectTypeComposer<unknown, unknown> | undefined {
        if (nullable) {
            return this.nullableAggregationSelectionTypes[fieldName];
        }
        return this.requiredAggregationSelectionTypes[fieldName];
    }

    private getOrCreateAggregationSelectionTypes({
        composer,
        nullable,
    }: {
        composer: SchemaComposer;
        nullable: boolean;
    }): Record<string, ObjectTypeComposer<unknown, unknown>> {
        const composeInt = {
            type: this.makeNullable("Int", nullable),
            resolve: numericalResolver,
            args: {},
        };

        const composeFloat = {
            type: this.makeNullable("Float", nullable),
            resolve: numericalResolver,
            args: {},
        };

        const composeId = {
            type: this.makeNullable("ID", nullable),
            resolve: idResolver,
            args: {},
        };

        const directives: string[] = this.subgraph ? [this.subgraph.getFullyQualifiedDirectiveName("shareable")] : [];

        const aggregationSelectionTypeMatrix: Array<{
            name: string;
            fields?: Record<string, any | string>;
            directives?: string[];
        }> = [
            {
                name: "ID",
                fields: {
                    shortest: composeId,
                    longest: composeId,
                },
                directives,
            },
            {
                name: "String",
                fields: {
                    shortest: this.makeNullable("String", nullable),
                    longest: this.makeNullable("String", nullable),
                },
                directives,
            },
            {
                name: "Float",
                fields: {
                    max: composeFloat,
                    min: composeFloat,
                    average: composeFloat,
                    sum: composeFloat,
                },
                directives,
            },
            {
                name: "Int",
                fields: {
                    max: composeInt,
                    min: composeInt,
                    average: composeFloat,
                    sum: composeInt,
                },
                directives,
            },
            {
                name: "BigInt",
                fields: {
                    max: this.makeNullable("BigInt", nullable),
                    min: this.makeNullable("BigInt", nullable),
                    average: this.makeNullable("BigInt", nullable),
                    sum: this.makeNullable("BigInt", nullable),
                },
                directives,
            },
            { name: "DateTime" },
            { name: "LocalDateTime" },
            { name: "LocalTime" },
            { name: "Time" },
            { name: "Duration" },
        ];

        const aggregationSelectionTypes = aggregationSelectionTypeMatrix.reduce<
            Record<string, ObjectTypeComposer<unknown, unknown>>
        >((res, { name, fields, directives }) => {
            const type = this.createType({ composer, nullable, name, fields, directives });
            res[name] = type;
            return res;
        }, {});

        return aggregationSelectionTypes;
    }

    private createType({
        composer,
        nullable,
        name,
        fields,
        directives = [],
    }: {
        composer: SchemaComposer;
        nullable: boolean;
        name: string;
        fields?: Record<string, any>;
        directives?: string[];
    }): ObjectTypeComposer<any, any> {
        const typeName = this.makeNullable(name, nullable);
        const nullableStr = nullable ? "Nullable" : "NonNullable";

        return composer.getOrCreateOTC(`${name}AggregateSelection${nullableStr}`, (tc) => {
            tc.addFields(fields ?? { min: typeName, max: typeName });
            for (const directive of directives) {
                tc.setDirectiveByName(directive);
            }
        });
    }

    private makeNullable(typeStr: string, isNullable: boolean) {
        return `${typeStr}${isNullable ? "" : "!"}`;
    }
}
