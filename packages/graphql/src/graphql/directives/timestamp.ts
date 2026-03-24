/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { DirectiveLocation, GraphQLDirective, GraphQLList, GraphQLNonNull } from "graphql";
import { TimestampOperationEnum } from "./arguments/enums/TimestampOperation";

export const timestampDirective = new GraphQLDirective({
    name: "timestamp",
    description:
        "Instructs @neo4j/graphql to generate timestamps on particular events, which will be available as the value of the specified field.",
    locations: [DirectiveLocation.FIELD_DEFINITION],
    args: {
        operations: {
            description: "Which events to generate timestamps on. Defaults to both create and update.",
            defaultValue: TimestampOperationEnum.getValues().map((v) => v.value),
            type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(TimestampOperationEnum))),
        },
    },
});
