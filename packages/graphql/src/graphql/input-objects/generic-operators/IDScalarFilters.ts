/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 *
 * This file is part of Neo4j.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
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
