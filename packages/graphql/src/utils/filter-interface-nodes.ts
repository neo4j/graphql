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

import type { GraphQLWhereArg, Node } from "../types";

/**
 *
 * We want to project implementation if there is either:
 *   * No where input
 *   * There is at least one root filter in addition to _on
 *   * There is no _on filter
 *   * _on is the only filter and the current implementation can be found within it
 */
export function filterInterfaceNodes({ node, whereInput }: { node: Node; whereInput?: GraphQLWhereArg }) {
    return (
        !whereInput ||
        Object.keys(whereInput).length > 1 ||
        !Object.prototype.hasOwnProperty.call(whereInput, "_on") ||
        (Object.keys(whereInput).length === 1 && Object.prototype.hasOwnProperty.call(whereInput._on, node.name))
    );
}
