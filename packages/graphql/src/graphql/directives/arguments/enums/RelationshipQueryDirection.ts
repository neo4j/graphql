/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { GraphQLEnumType } from "graphql";
import { RelationshipQueryDirectionOption } from "../../../../constants";

export const RelationshipQueryDirectionEnum = new GraphQLEnumType({
    name: "RelationshipQueryDirection",
    values: {
        [RelationshipQueryDirectionOption.DIRECTED]: {},
        [RelationshipQueryDirectionOption.UNDIRECTED]: {},
    },
});
