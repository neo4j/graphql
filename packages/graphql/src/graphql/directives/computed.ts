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

const description =
    "NOTE: The computed directive has been deprecated and will be removed in version 4.0. " +
    "Please use the @customResolver directive instead. Informs @neo4j/graphql that a field will be resolved by a " +
    "custom resolver, and allows specification of any field dependencies.";

export const computedDirective = new GraphQLDirective({
    name: "computed",
    description,
    locations: [DirectiveLocation.FIELD_DEFINITION],
    args: {
        from: {
            description: "Fields that the custom resolver will depend on.",
            type: new GraphQLList(new GraphQLNonNull(GraphQLString)),
        },
    },
});
