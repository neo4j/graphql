/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { GraphQLInt, GraphQLNonNull, GraphQLObjectType } from "graphql";

export const UpdateInfo = new GraphQLObjectType({
    name: "UpdateInfo",
    description:
        "Information about the number of nodes and relationships created and deleted during an update mutation",
    fields: {
        nodesCreated: {
            type: new GraphQLNonNull(GraphQLInt),
        },
        nodesDeleted: {
            type: new GraphQLNonNull(GraphQLInt),
        },
        relationshipsCreated: {
            type: new GraphQLNonNull(GraphQLInt),
        },
        relationshipsDeleted: {
            type: new GraphQLNonNull(GraphQLInt),
        },
    },
});
