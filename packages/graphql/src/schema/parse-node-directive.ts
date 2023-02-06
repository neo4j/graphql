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

import type { DirectiveNode } from "graphql";
import { valueFromASTUntyped } from "graphql";
import { NodeDirective } from "../classes/NodeDirective";

const labelDeprecationWarning =
    "NOTE: The label and additionalLabels arguments have been deprecated and will be removed in version 4.0.0. " +
    "Please use the labels argument instead. More information can be found at " +
    "https://neo4j.com/docs/graphql-manual/current/guides/v4-migration/" +
    "#_label_and_additionalLabels_arguments_removed_from_node_and_replaced_with_new_argument_labels";
let labelDeprecationWarningShown = false;

function parseNodeDirective(nodeDirective: DirectiveNode | undefined) {
    if (!nodeDirective || nodeDirective.name.value !== "node") {
        throw new Error("Undefined or incorrect directive passed into parseNodeDirective function");
    }

    const label = getArgumentValue<string>(nodeDirective, "label");
    const additionalLabels = getArgumentValue<string[]>(nodeDirective, "additionalLabels");
    if ((label || additionalLabels) && !labelDeprecationWarningShown) {
        console.warn(labelDeprecationWarning);
        labelDeprecationWarningShown = true;
    }

    return new NodeDirective({
        label,
        additionalLabels,
        labels: getArgumentValue<string[]>(nodeDirective, "labels"),
    });
}

function getArgumentValue<T>(directive: DirectiveNode, name: string): T | undefined {
    const argument = directive.arguments?.find((a) => a.name.value === name);
    return argument ? (valueFromASTUntyped(argument.value) as T) : undefined;
}

export default parseNodeDirective;
