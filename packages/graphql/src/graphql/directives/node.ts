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

import { DirectiveLocation, GraphQLDirective, GraphQLList, GraphQLNonNull, GraphQLString } from "graphql";

const pluralDescription =
    "NOTE: The plural argument has been deprecated and will be removed in version 4.0." +
    "Please use the @plural directive instead. Allows for the specification of the plural of the type name.";

export const nodeDirective = new GraphQLDirective({
    name: "node",
    description: "Informs @neo4j/graphql of node metadata",
    locations: [DirectiveLocation.OBJECT],
    args: {
        label: {
            description: "Map the GraphQL type to a custom Neo4j node label",
            type: GraphQLString,
        },
        additionalLabels: {
            description: "Map the GraphQL type to match additional Neo4j node labels",
            type: new GraphQLList(new GraphQLNonNull(GraphQLString)),
        },
        plural: {
            description: pluralDescription,
            type: GraphQLString,
        },
    },
});
