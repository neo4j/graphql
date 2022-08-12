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

import {
    CYPHER_RUNTIME,
    CYPHER_PLANNER,
    CYPHER_CONNECT_COMPONENTS_PLANNER,
    CYPHER_UPDATE_STRATEGY,
    CYPHER_EXPRESSION_ENGINE,
    CYPHER_OPERATOR_ENGINE,
    CYPHER_INTERPRETED_PIPES_FALLBACK,
    CYPHER_REPLAN,
} from "../environment";
import {
    CypherConnectComponentsPlanner,
    CypherExpressionEngine,
    CypherInterpretedPipesFallback,
    CypherOperatorEngine,
    CypherPlanner,
    CypherQueryOptions,
    CypherReplanning,
    CypherRuntime,
    CypherUpdateStrategy,
} from "../types";

export function parseEnvironmentQueryOptions(): CypherQueryOptions {
    const queryOptions: CypherQueryOptions = {};

    if (CYPHER_RUNTIME) {
        if (Object.values(CypherRuntime).includes(CYPHER_RUNTIME as unknown as CypherRuntime)) {
            queryOptions.runtime = CYPHER_RUNTIME as CypherRuntime;
        } else {
            throw new Error(
                `Invalid Cypher query option in environment variable ${
                    Object.keys({ CYPHER_RUNTIME })[0]
                }, expected one of: [${Object.values(CypherRuntime).join(", ")}]`
            );
        }
    }

    if (CYPHER_PLANNER) {
        if (Object.values(CypherPlanner).includes(CYPHER_PLANNER as unknown as CypherPlanner)) {
            queryOptions.planner = CYPHER_PLANNER as CypherPlanner;
        } else {
            throw new Error(
                `Invalid Cypher query option in environment variable ${
                    Object.keys({ CYPHER_PLANNER })[0]
                }, expected one of: [${Object.values(CypherPlanner).join(", ")}]`
            );
        }
    }

    if (CYPHER_CONNECT_COMPONENTS_PLANNER) {
        if (
            Object.values(CypherConnectComponentsPlanner).includes(
                CYPHER_CONNECT_COMPONENTS_PLANNER as unknown as CypherConnectComponentsPlanner
            )
        ) {
            queryOptions.connectComponentsPlanner = CYPHER_CONNECT_COMPONENTS_PLANNER as CypherConnectComponentsPlanner;
        } else {
            throw new Error(
                `Invalid Cypher query option in environment variable ${
                    Object.keys({ CYPHER_CONNECT_COMPONENTS_PLANNER })[0]
                }, expected one of: [${Object.values(CypherConnectComponentsPlanner).join(", ")}]`
            );
        }
    }

    if (CYPHER_UPDATE_STRATEGY) {
        if (Object.values(CypherUpdateStrategy).includes(CYPHER_UPDATE_STRATEGY as unknown as CypherUpdateStrategy)) {
            queryOptions.updateStrategy = CYPHER_UPDATE_STRATEGY as CypherUpdateStrategy;
        } else {
            throw new Error(
                `Invalid Cypher query option in environment variable ${
                    Object.keys({ CYPHER_UPDATE_STRATEGY })[0]
                }, expected one of: [${Object.values(CypherUpdateStrategy).join(", ")}]`
            );
        }
    }

    if (CYPHER_EXPRESSION_ENGINE) {
        if (
            Object.values(CypherExpressionEngine).includes(
                CYPHER_EXPRESSION_ENGINE as unknown as CypherExpressionEngine
            )
        ) {
            queryOptions.expressionEngine = CYPHER_EXPRESSION_ENGINE as CypherExpressionEngine;
        } else {
            throw new Error(
                `Invalid Cypher query option in environment variable ${
                    Object.keys({ CYPHER_EXPRESSION_ENGINE })[0]
                }, expected one of: [${Object.values(CypherExpressionEngine).join(", ")}]`
            );
        }
    }

    if (CYPHER_OPERATOR_ENGINE) {
        if (Object.values(CypherOperatorEngine).includes(CYPHER_OPERATOR_ENGINE as unknown as CypherOperatorEngine)) {
            queryOptions.operatorEngine = CYPHER_OPERATOR_ENGINE as CypherOperatorEngine;
        } else {
            throw new Error(
                `Invalid Cypher query option in environment variable ${
                    Object.keys({ CYPHER_OPERATOR_ENGINE })[0]
                }, expected one of: [${Object.values(CypherOperatorEngine).join(", ")}]`
            );
        }
    }

    if (CYPHER_INTERPRETED_PIPES_FALLBACK) {
        if (
            Object.values(CypherInterpretedPipesFallback).includes(
                CYPHER_INTERPRETED_PIPES_FALLBACK as unknown as CypherInterpretedPipesFallback
            )
        ) {
            queryOptions.interpretedPipesFallback = CYPHER_INTERPRETED_PIPES_FALLBACK as CypherInterpretedPipesFallback;
        } else {
            throw new Error(
                `Invalid Cypher query option in environment variable ${
                    Object.keys({ CYPHER_INTERPRETED_PIPES_FALLBACK })[0]
                }, expected one of: [${Object.values(CypherInterpretedPipesFallback).join(", ")}]`
            );
        }
    }

    if (CYPHER_REPLAN) {
        if (Object.values(CypherReplanning).includes(CYPHER_REPLAN as unknown as CypherReplanning)) {
            queryOptions.replan = CYPHER_REPLAN as CypherReplanning;
        } else {
            throw new Error(
                `Invalid Cypher query option in environment variable ${
                    Object.keys({ CYPHER_REPLAN })[0]
                }, expected one of: [${Object.values(CypherReplanning).join(", ")}]`
            );
        }
    }

    return queryOptions;
}
