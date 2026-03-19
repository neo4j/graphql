/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { DirectiveLocation, GraphQLDirective, GraphQLNonNull } from "graphql";
import { ScalarOrEnumType } from "./arguments/scalars/ScalarOrEnum";

export const defaultDirective = new GraphQLDirective({
    name: "default",
    description:
        "Instructs @neo4j/graphql to set the specified value as the default value in the CreateInput type for the object type in which this directive is used.",
    locations: [DirectiveLocation.FIELD_DEFINITION],
    args: {
        value: {
            description:
                "The default value to use. Must be a scalar type and must match the type of the field with which this directive decorates.",
            type: new GraphQLNonNull(ScalarOrEnumType),
        },
    },
});
