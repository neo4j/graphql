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
import { PopulatedByOperationEnum } from "./arguments/enums/PopulatedByOperation";

export const populatedByDirective = new GraphQLDirective({
    name: "populatedBy",
    description:
        "Instructs @neo4j/graphql to invoke the specified callback function when updating or creating the properties on a node or relationship.",
    locations: [DirectiveLocation.FIELD_DEFINITION],
    args: {
        callback: {
            description: "The name of the callback function that will be used to populate the fields values.",
            type: new GraphQLNonNull(GraphQLString),
        },
        operations: {
            description: "Which events to invoke the callback on.",
            defaultValue: PopulatedByOperationEnum.getValues().map((v) => v.value),
            type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(PopulatedByOperationEnum))),
        },
    },
});
