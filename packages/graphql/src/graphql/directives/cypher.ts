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

import { DirectiveLocation, GraphQLBoolean, GraphQLDirective, GraphQLNonNull, GraphQLString } from "graphql";

export const cypherDirective = new GraphQLDirective({
    name: "cypher",
    description:
        "Instructs @neo4j/graphql to run the specified Cypher statement in order to resolve the value of the field to which the directive is applied.",
    locations: [DirectiveLocation.FIELD_DEFINITION],
    args: {
        statement: {
            description:
                "The Cypher statement to run which returns a value of the same type composition as the field definition on which the directive is applied.",
            type: new GraphQLNonNull(GraphQLString),
        },
        experimental: {
            description:
                "An experimental implementation for custom Cypher directive, with improved performance. Warning: this feature is experimental and may not work as expected.",
            type: new GraphQLNonNull(GraphQLBoolean),
            defaultValue: false,
        },
    },
});
