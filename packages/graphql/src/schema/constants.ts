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

import { DEPRECATED } from "../constants";

export const DEPRECATE_IMPLICIT_LENGTH_AGGREGATION_FILTERS = {
    name: DEPRECATED,
    args: {
        reason: "Please use the explicit _LENGTH version for string aggregation.",
    },
};

export const DEPRECATE_EQUAL_FILTERS = {
    name: DEPRECATED,
    args: {
        reason: "Please use the explicit _EQ version",
    },
};

export const DEPRECATE_OPTIONS_ARGUMENT = {
    name: DEPRECATED,
    args: {
        reason: "Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.",
    },
};

export const DEPRECATE_UPDATE_CREATE_INPUT_FIELD = {
    name: DEPRECATED,
    args: {
        reason: "Top level create input argument in update is deprecated. Use the nested create field in the relationship within the update argument",
    },
};

export const DEPRECATE_UPDATE_DELETE_INPUT_FIELD = {
    name: DEPRECATED,
    args: {
        reason: "Top level delete input argument in update is deprecated. Use the nested delete field in the relationship within the update argument",
    },
};

export const DEPRECATE_UPDATE_CONNECT_INPUT_FIELD = {
    name: DEPRECATED,
    args: {
        reason: "Top level connect input argument in update is deprecated. Use the nested connect field in the relationship within the update argument",
    },
};

export const DEPRECATE_UPDATE_DISCONNECT_INPUT_FIELD = {
    name: DEPRECATED,
    args: {
        reason: "Top level disconnect input argument in update is deprecated. Use the nested disconnect field in the relationship within the update argument",
    },
};

export const DEPRECATE_UPDATE_CONNECT_OR_CREATE_INPUT_FIELD = {
    name: DEPRECATED,
    args: {
        reason: "Top level connectOrCreate input argument in update is deprecated. Use the nested connectOrCreate field in the relationship within the update argument",
    },
};
