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

import type { EnumTypeComposer, InputTypeComposer, ObjectTypeComposer } from "graphql-compose";
import { Memoize } from "typescript-memoize";
import type { SchemaBuilder } from "../SchemaBuilder";

export class StaticSchemaTypes {
    private schemaBuilder: SchemaBuilder;

    constructor({ schemaBuilder }: { schemaBuilder: SchemaBuilder }) {
        this.schemaBuilder = schemaBuilder;
    }

    public get pageInfo(): ObjectTypeComposer {
        return this.schemaBuilder.getOrCreateObjectType("PageInfo", () => {
            return { fields: { hasNextPage: "Boolean", hasPreviousPage: "Boolean" } };
        });
    }

    @Memoize()
    public get sortDirection(): EnumTypeComposer {
        return this.schemaBuilder.createEnumType("SortDirection", ["ASC", "DESC"]);
    }

    public get stringWhere(): InputTypeComposer {
        return this.schemaBuilder.getOrCreateInputType("StringWhere", () => {
            return {
                fields: {
                    OR: this.stringWhere.NonNull.List,
                    AND: this.stringWhere.NonNull.List,
                    NOT: this.stringWhere,
                    equals: "String",
                    in: "[String!]",
                    matches: "String",
                    contains: "String",
                    startsWith: "String",
                    endsWith: "String",
                },
            };
        });
    }

    public get intWhere(): InputTypeComposer {
        return this.schemaBuilder.getOrCreateInputType("IntWhere", () => {
            return {
                fields: {
                    OR: this.intWhere.NonNull.List,
                    AND: this.intWhere.NonNull.List,
                    NOT: this.intWhere,
                    equals: "Int",
                    in: "[Int!]",
                    lt: "Int",
                    lte: "Int",
                    gt: "Int",
                    gte: "Int",
                },
            };
        });
    }

    public get floatWhere(): InputTypeComposer {
        return this.schemaBuilder.getOrCreateInputType("FloatWhere", () => {
            return {
                fields: {
                    OR: this.floatWhere.NonNull.List,
                    AND: this.floatWhere.NonNull.List,
                    NOT: this.floatWhere,
                    equals: "Float",
                    in: "[Float!]",
                    lt: "Float",
                    lte: "Float",
                    gt: "Float",
                    gte: "Float",
                },
            };
        });
    }
}
