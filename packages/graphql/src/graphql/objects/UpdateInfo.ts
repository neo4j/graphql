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
