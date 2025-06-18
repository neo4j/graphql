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
import type { RelationshipAdapter } from "../../../../schema-model/relationship/model-adapters/RelationshipAdapter";
import type { QueryASTContext } from "../QueryASTContext";
import type { QueryASTNode } from "../QueryASTNode";
import { EntitySelection, type SelectionClause } from "./EntitySelection";
import { RelationshipSelectionPattern } from "./SelectionPattern/RelationshipSelectionPattern";

export class RelationshipSelection extends EntitySelection {
    private optional: boolean;

    private selectionPattern: RelationshipSelectionPattern;

    constructor({
        relationship,
        alias,
        targetOverride,
        optional,
    }: {
        relationship: RelationshipAdapter;
        alias?: string;
        directed?: boolean;
        targetOverride?: ConcreteEntityAdapter;
        optional?: boolean;
    }) {
        super();
        this.optional = optional ?? false;

        this.selectionPattern = new RelationshipSelectionPattern({
            relationship,
            alias,
            targetOverride,
        });
    }

    public getChildren(): QueryASTNode[] {
        return [...super.getChildren(), this.selectionPattern];
    }

    public apply(context: QueryASTContext<Cypher.Node>): {
        nestedContext: QueryASTContext<Cypher.Node>;
        selection: SelectionClause;
    } {
        const { nestedContext, pattern } = this.selectionPattern.apply(context);

        // NOTE: Direction not passed (can we remove it from context?)
        const match = new Cypher.Match(pattern);
        if (this.optional) {
            match.optional();
        }
        return {
            nestedContext: nestedContext,
            selection: match,
        };
    }
}
