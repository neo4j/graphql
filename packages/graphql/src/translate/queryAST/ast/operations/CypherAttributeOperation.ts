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
import type { AttributeAdapter } from "../../../../schema-model/attribute/model-adapters/AttributeAdapter";
import type { QueryASTContext } from "../QueryASTContext";
import type { QueryASTNode } from "../QueryASTNode";
import type { EntitySelection } from "../selection/EntitySelection";
import { Operation, type OperationTranspileResult } from "./operations";

/**
 * This operation is used to return top-level and nested @cypher fields that returns a scalar value.
 **/
export class CypherAttributeOperation extends Operation {
    private selection: EntitySelection;
    public cypherAttributeField: AttributeAdapter;
    private isNested: boolean;

    constructor(selection: EntitySelection, cypherAttributeField: AttributeAdapter, isNested: boolean) {
        super();
        this.selection = selection;
        this.cypherAttributeField = cypherAttributeField;
        this.isNested = isNested;
    }

    public getChildren(): QueryASTNode[] {
        return [this.selection];
    }

    public transpile(context: QueryASTContext<Cypher.Node | undefined>): OperationTranspileResult {
        const { selection: matchClause, nestedContext } = this.selection.apply(context);
        let retProj;

        if (this.isNested && this.cypherAttributeField.typeHelper.isList()) {
            retProj = [Cypher.collect(nestedContext.returnVariable), context.returnVariable];
        } else {
            retProj = [nestedContext.returnVariable, context.returnVariable];
        }
        const scope = context.getTargetScope();
        // by setting the return variable of this operation in the attribute scope, we can avoid duplicate the same cypher resolution for sorting and projection purposes
        scope.set(this.cypherAttributeField.name, context.returnVariable);
        const clause = matchClause.return(retProj);

        return {
            clauses: [clause],
            projectionExpr: context.returnVariable,
        };
    }
}
