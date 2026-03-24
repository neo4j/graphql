/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import {
    DirectiveLocation,
    GraphQLDirective,
    GraphQLInputObjectType,
    GraphQLList,
    GraphQLNonNull,
    GraphQLString,
} from "graphql";

export const fulltextDirective = new GraphQLDirective({
    name: "fulltext",
    description:
        "Informs @neo4j/graphql that there should be a fulltext index in the database, allows users to search by the index in the generated schema.",
    args: {
        indexes: {
            type: new GraphQLNonNull(
                new GraphQLList(
                    new GraphQLInputObjectType({
                        name: "FulltextInput",
                        fields: {
                            fields: {
                                type: new GraphQLNonNull(new GraphQLList(GraphQLString)),
                            },
                            queryName: {
                                type: new GraphQLNonNull(GraphQLString),
                            },
                            indexName: {
                                type: new GraphQLNonNull(GraphQLString),
                            },
                        },
                    })
                )
            ),
        },
    },
    locations: [DirectiveLocation.OBJECT],
});
