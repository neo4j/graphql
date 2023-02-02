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
    "NOTE: The plural argument has been deprecated and will be removed in version 4.0.0. " +
    "Please use the @plural directive instead. More information can be found at " +
    "https://neo4j.com/docs/graphql-manual/current/guides/v4-migration/" +
    "#_plural_argument_removed_from_node_and_replaced_with_plural. " +
    "Allows for the specification of the plural of the type name.";
const labelDescription =
    "NOTE: The label argument has been deprecated and will be removed in version 4.0.0. " +
    "Please use the labels argument instead. More information can be found at " +
    "https://neo4j.com/docs/graphql-manual/current/guides/v4-migration/" +
    "#_label_and_additionalLabels_arguments_removed_from_node_and_replaced_with_new_argument_labels. " +
    "Maps the GraphQL type to a custom Neo4j node label.";
const additionalLabelsDescription =
    "NOTE: The additionalLabels argument has been deprecated and will be removed in version 4.0.0. " +
    "Please use the labels argument instead. " +
    "If not used in conjunction with the also deprecated label argument, make sure to specify the GraphQL node type as first item in the array." +
    "More information can be found at " +
    "https://neo4j.com/docs/graphql-manual/current/guides/v4-migration/" +
    "#_label_and_additionalLabels_arguments_removed_from_node_and_replaced_with_new_argument_labels. " +
    "Map the GraphQL type to match additional Neo4j node labels.";

export const nodeDirective = new GraphQLDirective({
    name: "node",
    description: "Informs @neo4j/graphql of node metadata",
    locations: [DirectiveLocation.OBJECT],
    args: {
        label: {
            description: labelDescription,
            type: GraphQLString,
            deprecationReason: labelDescription,
        },
        additionalLabels: {
            description: additionalLabelsDescription,
            type: new GraphQLList(new GraphQLNonNull(GraphQLString)),
            deprecationReason: additionalLabelsDescription,
        },
        labels: {
            description: "Map the GraphQL type to match Neo4j node labels",
            type: new GraphQLList(new GraphQLNonNull(GraphQLString)),
        },
        plural: {
            description: pluralDescription,
            type: GraphQLString,
            deprecationReason: pluralDescription,
        },
    },
});
