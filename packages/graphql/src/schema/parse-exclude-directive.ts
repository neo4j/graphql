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

import { DirectiveNode, valueFromASTUntyped, ArgumentNode } from "graphql";
import { Exclude } from "../classes";

function parseExcludeDirective(excludeDirective: DirectiveNode | undefined | null) {
    if (!excludeDirective || excludeDirective.name.value !== "exclude") {
        throw new Error("Undefined or incorrect directive passed into parseExcludeDirective function");
    }

    const allResolvers = ["create", "read", "update", "delete"];

    if (!excludeDirective.arguments?.length) {
        return new Exclude({ operations: allResolvers });
    }

    const operations = excludeDirective.arguments?.find((a) => a.name.value === "operations") as ArgumentNode;

    const argumentValue = valueFromASTUntyped(operations.value);

    const result = argumentValue.map((val: string) => val.toLowerCase());

    return new Exclude({ operations: result });
}

export default parseExcludeDirective;
