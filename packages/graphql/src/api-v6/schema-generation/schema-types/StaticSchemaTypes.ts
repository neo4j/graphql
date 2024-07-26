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

import type { GraphQLInputType } from "graphql";
import { GraphQLBoolean, GraphQLID } from "graphql";
import type {
    EnumTypeComposer,
    InputTypeComposer,
    InterfaceTypeComposer,
    ListComposer,
    ObjectTypeComposer,
    ScalarTypeComposer,
} from "graphql-compose";
import { Memoize } from "typescript-memoize";
import { CartesianPoint } from "../../../graphql/objects/CartesianPoint";
import { Point } from "../../../graphql/objects/Point";
import * as Scalars from "../../../graphql/scalars";
import {
    GraphQLBigInt,
    GraphQLDate,
    GraphQLDateTime,
    GraphQLDuration,
    GraphQLLocalDateTime,
    GraphQLLocalTime,
    GraphQLTime,
} from "../../../graphql/scalars";
import type { SchemaBuilder } from "../SchemaBuilder";
import { toGraphQLList } from "../utils/to-graphql-list";
import { toGraphQLNonNull } from "../utils/to-graphql-non-null";

export class StaticSchemaTypes {
    private schemaBuilder: SchemaBuilder;
    public readonly filters: StaticFilterTypes;

    constructor({ schemaBuilder }: { schemaBuilder: SchemaBuilder }) {
        this.schemaBuilder = schemaBuilder;
        this.filters = new StaticFilterTypes({ schemaBuilder });
        this.addBuiltInTypes();
    }

    private addBuiltInTypes(): void {
        Object.values(Scalars).forEach((scalar) => {
            this.schemaBuilder.createScalar(scalar);
        });
        this.schemaBuilder.createObject(CartesianPoint);
        this.schemaBuilder.createObject(Point);
    }

    public get pageInfo(): ObjectTypeComposer {
        return this.schemaBuilder.getOrCreateObjectType("PageInfo", () => {
            return {
                fields: {
                    hasNextPage: this.schemaBuilder.types.boolean.NonNull,
                    hasPreviousPage: this.schemaBuilder.types.boolean.NonNull,
                    startCursor: this.schemaBuilder.types.string,
                    endCursor: this.schemaBuilder.types.string,
                },
            };
        });
    }

    @Memoize()
    public get sortDirection(): EnumTypeComposer {
        return this.schemaBuilder.createEnumType("SortDirection", ["ASC", "DESC"]);
    }

    public get globalNodeInterface(): InterfaceTypeComposer {
        return this.schemaBuilder.getOrCreateInterfaceType("Node", () => {
            return {
                fields: {
                    id: this.schemaBuilder.types.id.NonNull,
                },
            };
        });
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
                        equals: this.schemaBuilder.types.string.List,
                    },
                };
            });
        }

        return this.schemaBuilder.getOrCreateInputType("StringListWhere", () => {
            return {
                fields: {
                    equals: this.schemaBuilder.types.string.NonNull.List,
                },
            };
        });
    }

    public get stringWhere(): InputTypeComposer {
        return this.schemaBuilder.getOrCreateInputType("StringWhere", (itc) => {
            return {
                fields: {
                    ...this.createBooleanOperators(itc),
                    ...this.createStringOperators(this.schemaBuilder.types.string),
                    in: this.schemaBuilder.types.string.NonNull.List,
                },
            };
        });
    }

    public get globalIdWhere(): InputTypeComposer {
        return this.schemaBuilder.getOrCreateInputType("GlobalIdWhere", (_itc) => {
            return {
                fields: {
                    equals: this.schemaBuilder.types.string,
                    // TODO: Boolean fields and IN operator:
                    // ...this.createBooleanOperators(itc),
                    // in: toGraphQLList(toGraphQLNonNull(GraphQLString)),
                },
            };
        });
    }

    public get dateWhere(): InputTypeComposer {
        return this.schemaBuilder.getOrCreateInputType("DateWhere", (itc) => {
            return {
                fields: {
                    ...this.createBooleanOperators(itc),
                    in: toGraphQLList(toGraphQLNonNull(GraphQLDate)),
                    ...this.createNumericOperators(GraphQLDate),
                },
            };
        });
    }
    public getDateListWhere(nullable: boolean): InputTypeComposer {
        if (nullable) {
            return this.schemaBuilder.getOrCreateInputType("DateListWhereNullable", () => {
                return {
                    fields: {
                        equals: toGraphQLList(GraphQLDate),
                    },
                };
            });
        }

        return this.schemaBuilder.getOrCreateInputType("DateListWhere", () => {
            return {
                fields: {
                    equals: toGraphQLList(toGraphQLNonNull(GraphQLDate)),
                },
            };
        });
    }

    public get dateTimeWhere(): InputTypeComposer {
        return this.schemaBuilder.getOrCreateInputType("DateTimeWhere", (itc) => {
            return {
                fields: {
                    ...this.createBooleanOperators(itc),
                    in: toGraphQLList(toGraphQLNonNull(GraphQLDateTime)),
                    ...this.createNumericOperators(GraphQLDateTime),
                },
            };
        });
    }

    public getDateTimeListWhere(nullable: boolean): InputTypeComposer {
        if (nullable) {
            return this.schemaBuilder.getOrCreateInputType("DateTimeListWhereNullable", () => {
                return {
                    fields: {
                        equals: toGraphQLList(GraphQLDateTime),
                    },
                };
            });
        }

        return this.schemaBuilder.getOrCreateInputType("DateTimeListWhere", () => {
            return {
                fields: {
                    equals: toGraphQLList(toGraphQLNonNull(GraphQLDateTime)),
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
                    in: toGraphQLList(toGraphQLNonNull(GraphQLLocalDateTime)),
                },
            };
        });
    }

    public getLocalDateTimeListWhere(nullable: boolean): InputTypeComposer {
        if (nullable) {
            return this.schemaBuilder.getOrCreateInputType("LocalDateTimeListWhereNullable", () => {
                return {
                    fields: {
                        equals: toGraphQLList(GraphQLLocalDateTime),
                    },
                };
            });
        }

        return this.schemaBuilder.getOrCreateInputType("LocalDateTimeListWhere", () => {
            return {
                fields: {
                    equals: toGraphQLList(toGraphQLNonNull(GraphQLLocalDateTime)),
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
                    in: toGraphQLList(toGraphQLNonNull(GraphQLDuration)),
                },
            };
        });
    }

    public getDurationListWhere(nullable: boolean): InputTypeComposer {
        if (nullable) {
            return this.schemaBuilder.getOrCreateInputType("DurationListWhereNullable", () => {
                return {
                    fields: {
                        equals: toGraphQLList(GraphQLDuration),
                    },
                };
            });
        }

        return this.schemaBuilder.getOrCreateInputType("DurationListWhere", () => {
            return {
                fields: {
                    equals: toGraphQLList(toGraphQLNonNull(GraphQLDuration)),
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
                    in: toGraphQLList(toGraphQLNonNull(GraphQLTime)),
                },
            };
        });
    }

    public getTimeListWhere(nullable: boolean): InputTypeComposer {
        if (nullable) {
            return this.schemaBuilder.getOrCreateInputType("TimeListWhereNullable", () => {
                return {
                    fields: {
                        equals: toGraphQLList(GraphQLTime),
                    },
                };
            });
        }

        return this.schemaBuilder.getOrCreateInputType("TimeListWhere", () => {
            return {
                fields: {
                    equals: toGraphQLList(toGraphQLNonNull(GraphQLTime)),
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
                    in: toGraphQLList(toGraphQLNonNull(GraphQLLocalTime)),
                },
            };
        });
    }

    public getLocalTimeListWhere(nullable: boolean): InputTypeComposer {
        if (nullable) {
            return this.schemaBuilder.getOrCreateInputType("LocalTimeListWhereNullable", () => {
                return {
                    fields: {
                        equals: toGraphQLList(GraphQLLocalTime),
                    },
                };
            });
        }

        return this.schemaBuilder.getOrCreateInputType("LocalTimeListWhere", () => {
            return {
                fields: {
                    equals: toGraphQLList(toGraphQLNonNull(GraphQLLocalTime)),
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
                        equals: toGraphQLList(GraphQLID),
                    },
                };
            });
        }

        return this.schemaBuilder.getOrCreateInputType("IDListWhere", () => {
            return {
                fields: {
                    equals: toGraphQLList(toGraphQLNonNull(GraphQLID)),
                },
            };
        });
    }

    public get idWhere(): InputTypeComposer {
        return this.schemaBuilder.getOrCreateInputType("IDWhere", (itc) => {
            return {
                fields: {
                    ...this.createBooleanOperators(itc),
                    ...this.createStringOperators(this.schemaBuilder.types.id),
                    in: this.schemaBuilder.types.id.NonNull.List,
                },
            };
        });
    }

    public getIntListWhere(nullable: boolean): InputTypeComposer {
        if (nullable) {
            return this.schemaBuilder.getOrCreateInputType("IntListWhereNullable", () => {
                return {
                    fields: {
                        equals: this.schemaBuilder.types.int.List,
                    },
                };
            });
        }

        return this.schemaBuilder.getOrCreateInputType("IntListWhere", () => {
            return {
                fields: {
                    equals: this.schemaBuilder.types.int.NonNull.List,
                },
            };
        });
    }
    public get intWhere(): InputTypeComposer {
        return this.schemaBuilder.getOrCreateInputType("IntWhere", (itc) => {
            return {
                fields: {
                    ...this.createBooleanOperators(itc),
                    ...this.createNumericOperators(this.schemaBuilder.types.int),
                    in: this.schemaBuilder.types.int.NonNull.List,
                },
            };
        });
    }

    public getBigIntListWhere(nullable: boolean): InputTypeComposer {
        if (nullable) {
            return this.schemaBuilder.getOrCreateInputType("BigIntListWhereNullable", () => {
                return {
                    fields: {
                        equals: toGraphQLList(GraphQLBigInt),
                    },
                };
            });
        }

        return this.schemaBuilder.getOrCreateInputType("BigIntListWhere", () => {
            return {
                fields: {
                    equals: toGraphQLList(toGraphQLNonNull(GraphQLBigInt)),
                },
            };
        });
    }

    public get bigIntWhere(): InputTypeComposer {
        return this.schemaBuilder.getOrCreateInputType("BigIntWhere", (itc) => {
            return {
                fields: {
                    ...this.createBooleanOperators(itc),
                    ...this.createNumericOperators(GraphQLBigInt),
                    in: toGraphQLList(toGraphQLNonNull(GraphQLBigInt)),
                },
            };
        });
    }

    public getFloatListWhere(nullable: boolean): InputTypeComposer {
        if (nullable) {
            return this.schemaBuilder.getOrCreateInputType("FloatListWhereNullable", () => {
                return {
                    fields: {
                        equals: this.schemaBuilder.types.float.List,
                    },
                };
            });
        }

        return this.schemaBuilder.getOrCreateInputType("FloatListWhere", () => {
            return {
                fields: {
                    equals: this.schemaBuilder.types.float.NonNull.List,
                },
            };
        });
    }

    public get floatWhere(): InputTypeComposer {
        return this.schemaBuilder.getOrCreateInputType("FloatWhere", (itc) => {
            return {
                fields: {
                    ...this.createBooleanOperators(itc),
                    ...this.createNumericOperators(this.schemaBuilder.types.float),
                    in: this.schemaBuilder.types.float.NonNull.List,
                },
            };
        });
    }

    // public getCartesianListWhere(nullable: boolean): InputTypeComposer {
    //     if (nullable) {
    //         return this.schemaBuilder.getOrCreateInputType("CartesianListPointWhereNullable", () => {
    //             return {
    //                 fields: {
    //                     equals: toGraphQLList(CartesianPointInput),
    //                 },
    //             };
    //         });
    //     }

    //     return this.schemaBuilder.getOrCreateInputType("CartesianListPointWhere", () => {
    //         return {
    //             fields: {
    //                 equals: toGraphQLList(toGraphQLNonNull(CartesianPointInput)),
    //             },
    //         };
    //     });
    // }

    // public getPointListWhere(nullable: boolean): InputTypeComposer {
    //     if (nullable) {
    //         return this.schemaBuilder.getOrCreateInputType("PointListPointWhereNullable", () => {
    //             return {
    //                 fields: {
    //                     equals: toGraphQLList(PointInput),
    //                 },
    //             };
    //         });
    //     }

    //     return this.schemaBuilder.getOrCreateInputType("PointListPointWhere", () => {
    //         return {
    //             fields: {
    //                 equals: toGraphQLList(toGraphQLNonNull(PointInput)),
    //             },
    //         };
    //     });
    // }

    // public get cartesianPointWhere(): InputTypeComposer {
    //     return this.schemaBuilder.getOrCreateInputType("CartesianPointWhere", (itc) => {
    //         return {
    //             fields: {
    //                 ...this.createBooleanOperators(itc),
    //                 equals: CartesianPointInput,
    //                 in: toGraphQLList(toGraphQLNonNull(CartesianPointInput)),
    //                 lt: CartesianPointDistance,
    //                 lte: CartesianPointDistance,
    //                 gt: CartesianPointDistance,
    //                 gte: CartesianPointDistance,
    //                 distance: CartesianPointDistance,
    //             },
    //         };
    //     });
    // }

    // public get pointWhere(): InputTypeComposer {
    //     return this.schemaBuilder.getOrCreateInputType("PointWhere", (itc) => {
    //         return {
    //             fields: {
    //                 ...this.createBooleanOperators(itc),
    //                 equals: PointInput,
    //                 in: toGraphQLList(toGraphQLNonNull(PointInput)),
    //                 lt: PointDistance,
    //                 lte: PointDistance,
    //                 gt: PointDistance,
    //                 gte: PointDistance,
    //                 distance: PointDistance,
    //             },
    //         };
    //     });
    // }

    private createStringOperators(type: ScalarTypeComposer): Record<string, ScalarTypeComposer> {
        return {
            equals: type,
            // matches: type,
            contains: type,
            startsWith: type,
            endsWith: type,
        };
    }

    private createNumericOperators(
        type: GraphQLInputType | ScalarTypeComposer
    ): Record<string, GraphQLInputType | ScalarTypeComposer> {
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
}