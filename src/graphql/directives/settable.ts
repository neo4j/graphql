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

export const settableDirective = new GraphQLDirective({
    name: "settable",
    description: "Instructs @neo4j/graphql to generate this field for mutation inputs.",
    locations: [DirectiveLocation.FIELD_DEFINITION],
    args: {
        onCreate: {
            description: "Generates this input field for create operations.",
            type: new GraphQLNonNull(GraphQLBoolean),
            defaultValue: true,
        },
        onUpdate: {
            description: "Generates this input field for update operations.",
            type: new GraphQLNonNull(GraphQLBoolean),
            defaultValue: true,
        },
    },
});
