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

import { GraphQLInputObjectType } from "graphql";
import { LocalTimeScalarFilters } from "../generic-operators/LocalTimeScalarFilters";

export const LocalTimeScalarAggregationFilters = new GraphQLInputObjectType({
    name: "LocalTimeScalarAggregationFilters",
    description: "Filters for an aggregation of an LocalTime input field",
    fields: {
        max: { type: LocalTimeScalarFilters },
        min: { type: LocalTimeScalarFilters },
    },
});
