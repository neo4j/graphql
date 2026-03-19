/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { DirectiveLocation, GraphQLDirective, GraphQLNonNull } from "graphql";
import { ScalarOrEnumType } from "./arguments/scalars/ScalarOrEnum";

export const coalesceDirective = new GraphQLDirective({
    name: "coalesce",
    description:
        "Instructs @neo4j/graphql to wrap the property in a coalesce() function during queries, using the single value specified.",
    locations: [DirectiveLocation.FIELD_DEFINITION],
    args: {
        value: {
            description:
                "The value to use in the coalesce() function. Must be a scalar type and must match the type of the field with which this directive decorates.",
            type: new GraphQLNonNull(ScalarOrEnumType),
        },
    },
});
