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

export const DEPRECATE_NOT = {
    name: "deprecated",
    args: {
        reason: "Negation filters will be deprecated, use the NOT operator to achieve the same behavior",
    },
};

export const DEPRECATE_IMPLICIT_LENGTH_AGGREGATION_FILTERS = {
    name: "deprecated",
    args: {
        reason: "Please use the explicit _LENGTH version for string aggregation.",
    },
};

export const DEPRECATE_INVALID_AGGREGATION_FILTERS = {
    name: "deprecated",
    args: {
        reason: "Aggregation filters that are not relying on an aggregating function will be deprecated.",
    },
};
