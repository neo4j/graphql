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

import { DirectiveNode, valueFromASTUntyped } from "graphql";
import { NodeDirective } from "../classes/NodeDirective";

function parseNodeDirective(nodeDirective: DirectiveNode | undefined) {
    if (!nodeDirective || nodeDirective.name.value !== "node") {
        throw new Error("Undefined or incorrect directive passed into parseNodeDirective function");
    }

    return new NodeDirective({
        label: getArgumentValue<string>(nodeDirective, "label"),
        additionalLabels: getArgumentValue<string[]>(nodeDirective, "additionalLabels"),
        plural: getArgumentValue<string>(nodeDirective, "plural"),
    });
}

function getArgumentValue<T>(directive: DirectiveNode, name: string): T | undefined {
    const argument = directive.arguments?.find((a) => a.name.value === name);
    return argument ? (valueFromASTUntyped(argument.value) as T) : undefined;
}

export default parseNodeDirective;
