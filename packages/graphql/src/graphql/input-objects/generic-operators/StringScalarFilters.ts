/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { GraphQLInputObjectType, GraphQLList, GraphQLNonNull, GraphQLString } from "graphql";
import type { Neo4jFeaturesSettings } from "../../../types";

export function getStringScalarFilters(features?: Neo4jFeaturesSettings): GraphQLInputObjectType {
    const fields = {
        eq: {
            type: GraphQLString,
        },
        in: { type: new GraphQLList(new GraphQLNonNull(GraphQLString)) },
        contains: { type: GraphQLString },
        endsWith: { type: GraphQLString },
        startsWith: { type: GraphQLString },
    };
    for (const filter of Object.entries(features?.filters?.String ?? {})) {
        const [filterName, isEnabled] = filter;
        if (isEnabled) {
            switch (filterName) {
                case "MATCHES":
                    fields["matches"] = { type: GraphQLString };
                    break;
                case "GT":
                    fields["gt"] = { type: GraphQLString };
                    break;
                case "GTE":
                    fields["gte"] = { type: GraphQLString };
                    break;
                case "LT":
                    fields["lt"] = { type: GraphQLString };
                    break;
                case "LTE":
                    fields["lte"] = { type: GraphQLString };
                    break;
                case "CASE_INSENSITIVE": {
                    const CaseInsensitiveFilters = getCaseInsensitiveStringScalarFilters(features);
                    fields["caseInsensitive"] = { type: CaseInsensitiveFilters };
                }
            }
        }
    }
    return new GraphQLInputObjectType({
        name: "StringScalarFilters",
        description: "String filters",
        fields,
    });
}

function getCaseInsensitiveStringScalarFilters(features?: Neo4jFeaturesSettings): GraphQLInputObjectType {
    const fields = {
        eq: {
            type: GraphQLString,
        },
        in: { type: new GraphQLList(new GraphQLNonNull(GraphQLString)) },
        contains: { type: GraphQLString },
        endsWith: { type: GraphQLString },
        startsWith: { type: GraphQLString },
    };
    for (const filter of Object.entries(features?.filters?.String ?? {})) {
        const [filterName, isEnabled] = filter;
        if (isEnabled) {
            switch (filterName) {
                case "MATCHES":
                    fields["matches"] = { type: GraphQLString };
                    break;
                case "GT":
                    fields["gt"] = { type: GraphQLString };
                    break;
                case "GTE":
                    fields["gte"] = { type: GraphQLString };
                    break;
                case "LT":
                    fields["lt"] = { type: GraphQLString };
                    break;
                case "LTE":
                    fields["lte"] = { type: GraphQLString };
                    break;
            }
        }
    }
    return new GraphQLInputObjectType({
        name: "CaseInsensitiveStringScalarFilters",
        description: "Case insensitive String filters",
        fields,
    });
}

export const StringListFilters = new GraphQLInputObjectType({
    name: "StringListFilters",
    description: "String list filters",
    fields: {
        eq: { type: new GraphQLList(new GraphQLNonNull(GraphQLString)) },
        includes: { type: GraphQLString },
    },
});
