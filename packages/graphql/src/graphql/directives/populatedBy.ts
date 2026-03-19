/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { DirectiveLocation, GraphQLDirective, GraphQLList, GraphQLNonNull, GraphQLString } from "graphql";
import { PopulatedByOperationEnum } from "./arguments/enums/PopulatedByOperation";

export const populatedByDirective = new GraphQLDirective({
    name: "populatedBy",
    description:
        "Instructs @neo4j/graphql to invoke the specified callback function when updating or creating the properties on a node or relationship.",
    locations: [DirectiveLocation.FIELD_DEFINITION],
    args: {
        callback: {
            description: "The name of the callback function that will be used to populate the fields values.",
            type: new GraphQLNonNull(GraphQLString),
        },
        operations: {
            description: "Which events to invoke the callback on.",
            defaultValue: PopulatedByOperationEnum.getValues().map((v) => v.value),
            type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(PopulatedByOperationEnum))),
        },
    },
});
