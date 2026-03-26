/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { GraphQLID, GraphQLInputObjectType, GraphQLList, GraphQLNonNull } from "graphql";
import type { Neo4jFeaturesSettings } from "../../../types";

export function getIDScalarFilters(features?: Neo4jFeaturesSettings): GraphQLInputObjectType {
    const fields = {
        eq: {
            type: GraphQLID,
        },
        in: { type: new GraphQLList(new GraphQLNonNull(GraphQLID)) },
        contains: { type: GraphQLID },
        endsWith: { type: GraphQLID },
        startsWith: { type: GraphQLID },
    };
    for (const filter of Object.entries(features?.filters?.ID ?? {})) {
        const [filterName, isEnabled] = filter;
        if (isEnabled) {
            switch (filterName) {
                case "MATCHES":
                    fields["matches"] = { type: GraphQLID };
                    break;
                case "GT":
                    fields["gt"] = { type: GraphQLID };
                    break;
                case "GTE":
                    fields["gte"] = { type: GraphQLID };
                    break;
                case "LT":
                    fields["lt"] = { type: GraphQLID };
                    break;
                case "LTE":
                    fields["lte"] = { type: GraphQLID };
                    break;
            }
        }
    }
    return new GraphQLInputObjectType({
        name: "IDScalarFilters",
        description: "ID filters",
        fields,
    });
}

export const IDListFilters = new GraphQLInputObjectType({
    name: "IDListFilters",
    description: "ID list filters",
    fields: {
        eq: { type: new GraphQLList(new GraphQLNonNull(GraphQLID)) },
        includes: { type: GraphQLID },
    },
});
