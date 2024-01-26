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

import Cypher from "@neo4j/cypher-builder";
import type { Node } from "../../../types";
import type { AuthorizationOperation } from "../../../schema-model/annotation/AuthorizationAnnotation";
import {
    createAuthorizationBeforePredicateField,
    createAuthorizationBeforePredicate,
} from "../create-authorization-before-predicate";
import type { NodeMap } from "../types/node-map";
import { compilePredicateReturn } from "./compile-predicate-return";
import type { Neo4jGraphQLTranslationContext } from "../../../types/neo4j-graphql-translation-context";

type AuthorizationBeforeAndParams = {
    cypher: string;
    params: Record<string, any>;
    subqueries?: string;
};

type StringNodeMap = {
    node: Node;
    variable: string;
    fieldName?: string;
};

function stringNodeMapToNodeMap(stringNodeMap: StringNodeMap[]): NodeMap[] {
    return stringNodeMap.map((nodeMap) => {
        return {
            ...nodeMap,
            variable: new Cypher.NamedNode(nodeMap.variable),
        };
    });
}

export function createAuthorizationBeforeAndParams({
    context,
    nodes,
    operations,
    indexPrefix,
}: {
    context: Neo4jGraphQLTranslationContext;
    nodes: StringNodeMap[];
    operations: AuthorizationOperation[];
    indexPrefix?: string;
}): AuthorizationBeforeAndParams | undefined {
    const nodeMap = stringNodeMapToNodeMap(nodes);

    const predicateReturn = createAuthorizationBeforePredicate({
        context,
        nodes: nodeMap,
        operations,
    });

    if (predicateReturn) {
        return compilePredicateReturn(predicateReturn, `${indexPrefix || "_"}before_`);
    }

    return undefined;
}

export function createAuthorizationBeforeAndParamsField({
    context,
    nodes,
    operations,
}: {
    context: Neo4jGraphQLTranslationContext;
    nodes: StringNodeMap[];
    operations: AuthorizationOperation[];
}): AuthorizationBeforeAndParams | undefined {
    const nodeMap = stringNodeMapToNodeMap(nodes);

    const predicateReturn = createAuthorizationBeforePredicateField({
        context,
        nodes: nodeMap,
        operations,
    });

    if (predicateReturn) {
        return compilePredicateReturn(predicateReturn, "_before_");
    }

    return undefined;
}
