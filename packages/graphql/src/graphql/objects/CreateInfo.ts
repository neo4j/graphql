/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { GraphQLInt, GraphQLNonNull, GraphQLObjectType } from "graphql";

export const CreateInfo = new GraphQLObjectType({
    name: "CreateInfo",
    description: "Information about the number of nodes and relationships created during a create mutation",
    fields: {
        nodesCreated: {
            type: new GraphQLNonNull(GraphQLInt),
        },
        relationshipsCreated: {
            type: new GraphQLNonNull(GraphQLInt),
        },
    },
});
