/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { GraphQLInt, GraphQLNonNull, GraphQLObjectType } from "graphql";

export const DeleteInfo = new GraphQLObjectType({
    name: "DeleteInfo",
    description: "Information about the number of nodes and relationships deleted during a delete mutation",
    fields: {
        nodesDeleted: {
            type: new GraphQLNonNull(GraphQLInt),
        },
        relationshipsDeleted: {
            type: new GraphQLNonNull(GraphQLInt),
        },
    },
});
