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
import type { ConcreteEntityAdapter } from "../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { QueryASTContext } from "../../translate/queryAST/ast/QueryASTContext";
import type { QueryASTNode } from "../../translate/queryAST/ast/QueryASTNode";
import type { Filter } from "../../translate/queryAST/ast/filters/Filter";
import type { OperationTranspileResult } from "../../translate/queryAST/ast/operations/operations";
import { MutationOperation } from "../../translate/queryAST/ast/operations/operations";
import type { EntitySelection } from "../../translate/queryAST/ast/selection/EntitySelection";
import { filterTruthy } from "../../utils/utils";
import type { V6ReadOperation } from "./ConnectionReadOperation";
import type { UpdateProperty } from "./MutationInput/UpdateProperty";

export class V6UpdateOperation extends MutationOperation {
    public readonly target: ConcreteEntityAdapter;
    private readonly inputFields: UpdateProperty[];
    private readonly projection: V6ReadOperation | undefined;

    protected filters: Filter[];
    protected selection: EntitySelection<Cypher.Match>;

    constructor({
        target,
        inputFields,
        projection,
        selection,
        filters = [],
    }: {
        selection: EntitySelection<Cypher.Match>;
        target: ConcreteEntityAdapter;
        inputFields: UpdateProperty[];
        projection?: V6ReadOperation;
        filters?: Filter[];
    }) {
        super();
        this.target = target;
        this.inputFields = inputFields;
        this.projection = projection;
        this.selection = selection;
        this.filters = filters;
    }

    public getChildren(): QueryASTNode[] {
        return filterTruthy([...this.inputFields.values(), ...this.filters, this.selection, this.projection]);
    }

    public transpile(context: QueryASTContext): OperationTranspileResult {
        if (!context.hasTarget()) {
            throw new Error("No parent node found!");
        }

        const { selection: selectionClause, nestedContext } = this.selection.apply(context);

        const setParams = this.inputFields.flatMap((p) => p.getSetParams(nestedContext));

        selectionClause.set(...setParams);

        // TODO: filter subqueries
        const filterPredicates = this.filters.map((f) => {
            return f.getPredicate(nestedContext);
        });
        selectionClause.where(Cypher.and(...filterPredicates));

        const clauses = Cypher.concat(selectionClause, ...this.getProjectionClause(nestedContext));
        return { projectionExpr: context.returnVariable, clauses: [clauses] };
    }

    private getProjectionClause(context: QueryASTContext): Cypher.Clause[] {
        if (!this.projection) {
            return [];
        }
        return this.projection.transpile(context).clauses;
    }
}
