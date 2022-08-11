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

import * as pkg from "../package.json";

export const CYPHER_RUNTIME = process.env.CYPHER_RUNTIME;
export const CYPHER_PLANNER = process.env.CYPHER_PLANNER;
export const CYPHER_CONNECT_COMPONENTS_PLANNER = process.env.CYPHER_CONNECT_COMPONENTS_PLANNER;
export const CYPHER_UPDATE_STRATEGY = process.env.CYPHER_UPDATE_STRATEGY;
export const CYPHER_EXPRESSION_ENGINE = process.env.CYPHER_EXPRESSION_ENGINE;
export const CYPHER_OPERATOR_ENGINE = process.env.CYPHER_OPERATOR_ENGINE;
export const CYPHER_INTERPRETED_PIPES_FALLBACK = process.env.CYPHER_INTERPRETED_PIPES_FALLBACK;
export const CYPHER_REPLAN = process.env.CYPHER_REPLAN;
export const NPM_PACKAGE_VERSION = pkg.version;
export const NPM_PACKAGE_NAME = pkg.name;
