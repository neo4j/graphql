/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { GraphQLResolveInfo } from "graphql";

export const resolvers = {
    User: {
        averageProductsCreatedPerYear: (_source, _args, _context, info: GraphQLResolveInfo) => {
            return Math.floor(
                (info.variableValues.representations as any)[0].totalProductsCreated /
                    (info.variableValues.representations as any)[0].yearsOfEmployment
            );
        },
    },
};
