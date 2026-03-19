/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { DirectiveLocation, GraphQLDirective } from "graphql";
import { GraphQLSelectionSet } from "../scalars/SelectionSet";

export const customResolverDirective = new GraphQLDirective({
    name: "customResolver",
    description:
        "Informs @neo4j/graphql that a field will be resolved by a custom resolver, and allows specification of any field dependencies.",
    locations: [DirectiveLocation.FIELD_DEFINITION],
    args: {
        requires: {
            description:
                "Selection set of the fields that the custom resolver will depend on. These fields are passed as an object to the first argument of the custom resolver.",
            type: GraphQLSelectionSet,
        },
    },
});
