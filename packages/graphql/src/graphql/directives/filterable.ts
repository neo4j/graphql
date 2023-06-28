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

import { DirectiveLocation, GraphQLBoolean, GraphQLDirective, GraphQLNonNull } from "graphql";

export const filterableDirective = new GraphQLDirective({
    name: "filterable",
    description: "Instructs @neo4j/graphql to generate filters for this field.",
    locations: [DirectiveLocation.FIELD_DEFINITION],
    args: {
        byValue: {
            description: "Generates filters for this field",
            type: new GraphQLNonNull(GraphQLBoolean),
            defaultValue: true,
        },
        byAggregate: {
            description: "Generates filters for aggregate value based on this field",
            type: new GraphQLNonNull(GraphQLBoolean),
            defaultValue: false,
        },
    },
});
