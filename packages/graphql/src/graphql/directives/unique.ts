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

import { DirectiveLocation, GraphQLDirective, GraphQLString } from "graphql";

export const uniqueDirective = new GraphQLDirective({
    name: "unique",
    description:
        "Informs @neo4j/graphql that there should be a uniqueness constraint in the database for the decorated field.",
    locations: [DirectiveLocation.FIELD_DEFINITION],
    args: {
        constraintName: {
            description: "The name which should be used for this constraint",
            type: GraphQLString, // TODO: make the constraintName required in v6
        },
    },
});
