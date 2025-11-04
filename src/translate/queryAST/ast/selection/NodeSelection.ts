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
import type { ConcreteEntityAdapter } from "../../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import { createNode, getEntityLabels } from "../../utils/create-node-from-entity";
import { QueryASTContext } from "../QueryASTContext";
import { EntitySelection, type SelectionClause } from "./EntitySelection";

export class NodeSelection extends EntitySelection {
    private target: ConcreteEntityAdapter;
    private alias: string | undefined;
    private optional: boolean;
    private useContextTarget: boolean;

    constructor({
        target,
        alias,
        optional = false,
        useContextTarget = false,
    }: {
        target: ConcreteEntityAdapter;
        alias?: string;
        optional?: boolean;
        useContextTarget?: boolean;
    }) {
        super();
        this.target = target;
        this.alias = alias;
        this.optional = optional;
        this.useContextTarget = useContextTarget;
    }

    public apply(context: QueryASTContext): {
        nestedContext: QueryASTContext<Cypher.Node>;
        selection: SelectionClause;
    } {
        let node: Cypher.Node;
        let matchPattern: Cypher.Pattern | undefined;

        // useContextTarget is used when you have to select a node already matched,
        // this could be simplified a lot, it's currently not possible as there is no way to build a Cypher.Node from an existing Cypher.Node.
        if (this.useContextTarget) {
            if (!context.hasTarget()) {
                throw new Error("No target found in the context");
            }
            node = context.target;
            matchPattern = new Cypher.Pattern(node);
        } else {
            node = createNode(this.alias);

            matchPattern = new Cypher.Pattern(node, {
                labels: getEntityLabels(this.target, context.neo4jGraphQLContext),
            });
        }
        const match = new Cypher.Match(matchPattern ?? node);

        if (this.optional) {
            match.optional();
        }

        return {
            selection: match,
            nestedContext: new QueryASTContext({
                target: node,
                neo4jGraphQLContext: context.neo4jGraphQLContext,
                returnVariable: context.returnVariable,
                env: context.env,
                shouldCollect: context.shouldCollect,
            }),
        };
    }
}
