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

import type { GraphQLScalarType } from "graphql";
import { GraphQLBoolean, GraphQLFloat, GraphQLID, GraphQLInt, GraphQLString } from "graphql";
import type { EnumTypeComposer, InputTypeComposer, ObjectTypeComposer, ListComposer } from "graphql-compose";
import { Memoize } from "typescript-memoize";
import {
    GraphQLDate,
    GraphQLDateTime,
    GraphQLDuration,
    GraphQLLocalDateTime,
    GraphQLLocalTime,
    GraphQLTime,
} from "../../../graphql/scalars";
import type { SchemaBuilder } from "../SchemaBuilder";

import * as Scalars from "../../../graphql/scalars";

function nonNull(type: string): string {
    return `${type}!`;
}

function list(type: string): string {
    return `[${type}]`;
}

export class StaticSchemaTypes {
    private schemaBuilder: SchemaBuilder;
    public readonly filters: StaticFilterTypes;

    constructor({ schemaBuilder }: { schemaBuilder: SchemaBuilder }) {
        this.schemaBuilder = schemaBuilder;
        this.filters = new StaticFilterTypes({ schemaBuilder });
        this.addScalars();
    }

    private addScalars(): void {
        Object.values(Scalars).forEach((scalar) => {
            this.schemaBuilder.createScalar(scalar);
        });
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
}

class StaticFilterTypes {
    private schemaBuilder: SchemaBuilder;

    constructor({ schemaBuilder }: { schemaBuilder: SchemaBuilder }) {
        this.schemaBuilder = schemaBuilder;
    }

    public getStringListWhere(nullable: boolean): InputTypeComposer {
        if (nullable) {
            return this.schemaBuilder.getOrCreateInputType("StringListWhereNullable", () => {
                return {
                    fields: {
                        equals: list(GraphQLString.name),
                    },
                };
            });
        }

        return this.schemaBuilder.getOrCreateInputType("StringListWhere", () => {
            return {
                fields: {
                    equals: list(nonNull(GraphQLString.name)),
                },
            };
        });
    }

    public get stringWhere(): InputTypeComposer {
        return this.schemaBuilder.getOrCreateInputType("StringWhere", (itc) => {
            return {
                fields: {
                    ...this.createBooleanOperators(itc),
                    ...this.createStringOperators(GraphQLString),
                    in: list(nonNull(GraphQLString.name)),
                },
            };
        });
    }

    public get dateWhere(): InputTypeComposer {
        return this.schemaBuilder.getOrCreateInputType("DateWhere", (itc) => {
            return {
                fields: {
                    ...this.createBooleanOperators(itc),
                    in: list(nonNull(GraphQLDate.name)),
                    ...this.createNumericOperators(GraphQLDate),
                },
            };
        });
    }

    public get dateTimeWhere(): InputTypeComposer {
        return this.schemaBuilder.getOrCreateInputType("DateTimeWhere", (itc) => {
            return {
                fields: {
                    ...this.createBooleanOperators(itc),
                    in: list(nonNull(GraphQLDateTime.name)),
                    ...this.createNumericOperators(GraphQLDateTime),
                },
            };
        });
    }

    public get localDateTimeWhere(): InputTypeComposer {
        return this.schemaBuilder.getOrCreateInputType("LocalDateTimeWhere", (itc) => {
            return {
                fields: {
                    ...this.createBooleanOperators(itc),
                    ...this.createNumericOperators(GraphQLLocalDateTime),
                    in: list(nonNull(GraphQLLocalDateTime.name)),
                },
            };
        });
    }

    public get durationWhere(): InputTypeComposer {
        return this.schemaBuilder.getOrCreateInputType("DurationWhere", (itc) => {
            return {
                fields: {
                    ...this.createBooleanOperators(itc),
                    ...this.createNumericOperators(GraphQLDuration),
                    in: list(nonNull(GraphQLDuration.name)),
                },
            };
        });
    }

    public get timeWhere(): InputTypeComposer {
        return this.schemaBuilder.getOrCreateInputType("TimeWhere", (itc) => {
            return {
                fields: {
                    ...this.createBooleanOperators(itc),
                    ...this.createNumericOperators(GraphQLTime),
                    in: list(nonNull(GraphQLTime.name)),
                },
            };
        });
    }

    public get localTimeWhere(): InputTypeComposer {
        return this.schemaBuilder.getOrCreateInputType("LocalTimeWhere", (itc) => {
            return {
                fields: {
                    ...this.createBooleanOperators(itc),
                    ...this.createNumericOperators(GraphQLLocalTime),
                    in: list(nonNull(GraphQLLocalTime.name)),
                },
            };
        });
    }

    public getBooleanListWhere(nullable: boolean): InputTypeComposer {
        if (nullable) {
            return this.schemaBuilder.getOrCreateInputType("StringListWhereNullable", () => {
                return {
                    fields: {
                        equals: list(nonNull(GraphQLBoolean.name)),
                    },
                };
            });
        }

        return this.schemaBuilder.getOrCreateInputType("StringListWhere", () => {
            return {
                fields: {
                    equals: list(nonNull(GraphQLBoolean.name)),
                },
            };
        });
    }

    public get booleanWhere(): InputTypeComposer {
        return this.schemaBuilder.getOrCreateInputType("BooleanWhere", (itc) => {
            return {
                fields: {
                    OR: itc.NonNull.List,
                    AND: itc.NonNull.List,
                    NOT: itc,
                    equals: GraphQLBoolean,
                },
            };
        });
    }

    public getIdListWhere(nullable: boolean): InputTypeComposer {
        if (nullable) {
            return this.schemaBuilder.getOrCreateInputType("IDListWhereNullable", () => {
                return {
                    fields: {
                        equals: list(GraphQLID.name),
                    },
                };
            });
        }

        return this.schemaBuilder.getOrCreateInputType("IDListWhere", () => {
            return {
                fields: {
                    equals: list(nonNull(GraphQLID.name)),
                },
            };
        });
    }

    public get idWhere(): InputTypeComposer {
        return this.schemaBuilder.getOrCreateInputType("IDWhere", (itc) => {
            return {
                fields: {
                    ...this.createBooleanOperators(itc),
                    ...this.createStringOperators(GraphQLID),
                    in: list(nonNull(GraphQLID.name)),
                },
            };
        });
    }

    public getIntListWhere(nullable: boolean): InputTypeComposer {
        if (nullable) {
            return this.schemaBuilder.getOrCreateInputType("IntListWhereNullable", () => {
                return {
                    fields: {
                        equals: list(GraphQLInt.name),
                    },
                };
            });
        }

        return this.schemaBuilder.getOrCreateInputType("IntListWhere", () => {
            return {
                fields: {
                    equals: list(nonNull(GraphQLInt.name)),
                },
            };
        });
    }

    public get intWhere(): InputTypeComposer {
        return this.schemaBuilder.getOrCreateInputType("IntWhere", (itc) => {
            return {
                fields: {
                    ...this.createBooleanOperators(itc),
                    ...this.createNumericOperators(GraphQLInt),
                    in: list(nonNull(GraphQLInt.name)),
                },
            };
        });
    }

    public getFloatListWhere(nullable: boolean): InputTypeComposer {
        if (nullable) {
            return this.schemaBuilder.getOrCreateInputType("FloatListWhereNullable", () => {
                return {
                    fields: {
                        equals: list(GraphQLFloat.name),
                    },
                };
            });
        }

        return this.schemaBuilder.getOrCreateInputType("FloatListWhere", () => {
            return {
                fields: {
                    equals: list(nonNull(GraphQLFloat.name)),
                },
            };
        });
    }

    public get floatWhere(): InputTypeComposer {
        return this.schemaBuilder.getOrCreateInputType("FloatWhere", (itc) => {
            return {
                fields: {
                    ...this.createBooleanOperators(itc),
                    ...this.createNumericOperators(GraphQLFloat),
                    in: list(nonNull(GraphQLFloat.name)),
                },
            };
        });
    }

    private createStringOperators(type: GraphQLScalarType): Record<string, GraphQLScalarType> {
        return {
            equals: type,
            // matches: type,
            contains: type,
            startsWith: type,
            endsWith: type,
        };
    }

    private createNumericOperators(type: GraphQLScalarType): Record<string, GraphQLScalarType> {
        return {
            equals: type,
            lt: type,
            lte: type,
            gt: type,
            gte: type,
        };
    }

    private createBooleanOperators(itc: InputTypeComposer): Record<string, ListComposer | InputTypeComposer> {
        return {
            OR: itc.NonNull.List,
            AND: itc.NonNull.List,
            NOT: itc,
        };
    }
    // private getListWhereFields(itc: InputTypeComposer, targetType: InputTypeComposer): Record<string, any> {
    //     return {
    //         OR: itc.NonNull.List,
    //         AND: itc.NonNull.List,
    //         NOT: itc,
    //         all: targetType,
    //         none: targetType,
    //         single: targetType,
    //         some: targetType,
    //     };
    // }
}
