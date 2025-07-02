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
import { filterTruthy } from "../../../../utils/utils";
import { getEntityLabels } from "../../utils/create-node-from-entity";
import type { QueryASTContext } from "../QueryASTContext";
import type { QueryASTNode } from "../QueryASTNode";
import type { Filter } from "../filters/Filter";
import type { InputField } from "../input-fields/InputField";
import type { SelectionPattern } from "../selection/SelectionPattern/SelectionPattern";
import type { ReadOperation } from "./ReadOperation";
import { MutationOperation, type OperationTranspileResult } from "./operations";
import { wrapSubqueriesInCypherCalls } from "../../utils/wrap-subquery-in-calls";

export class ConnectOperation extends MutationOperation {
    public readonly target: ConcreteEntityAdapter;
    public readonly relationship: RelationshipAdapter;

    private selectionPattern: SelectionPattern;

    // The response fields in the mutation, currently only READ operations are supported in the MutationResponse
    public projectionOperations: ReadOperation[] = [];

    public readonly inputFields: Map<string, InputField> = new Map();
    private filters: Filter[];

    constructor({
        target,
        relationship,
        selectionPattern,
        filters = [],
    }: {
        target: ConcreteEntityAdapter;
        selectionPattern: SelectionPattern;
        relationship: RelationshipAdapter;
        filters?: Filter[];
    }) {
        super();
        this.target = target;
        this.relationship = relationship;
        this.selectionPattern = selectionPattern;
        this.filters = filters;
    }

    public getChildren(): QueryASTNode[] {
        return filterTruthy([
            this.selectionPattern,
            ...this.filters,
            ...this.inputFields.values(),
            ...this.projectionOperations,
        ]);
    }

    /**
     * Get and set field methods are utilities to remove duplicate fields between separate inputs
     * TODO: This logic should be handled in the factory.
     */
    public getField(key: string, attachedTo: "node" | "relationship") {
        return this.inputFields.get(`${attachedTo}_${key}`);
    }

    public addField(field: InputField, attachedTo: "node" | "relationship") {
        if (!this.inputFields.has(field.name)) {
            this.inputFields.set(`${attachedTo}_${field.name}`, field);
        }
    }

    public addProjectionOperations(operations: ReadOperation[]) {
        this.projectionOperations.push(...operations);
    }

    public transpile(context: QueryASTContext): OperationTranspileResult {
        if (!context.hasTarget()) {
            throw new Error("No parent node found!");
        }
        // context.env.topLevelOperationName = "CREATE";
        // // TODO: implement the actual create / unwind create

        const { nestedContext } = this.selectionPattern.apply(context);

        const matchPattern = new Cypher.Pattern(nestedContext.target, {
            labels: getEntityLabels(this.target, context.neo4jGraphQLContext),
        });
        const filterSubqueries = wrapSubqueriesInCypherCalls(nestedContext, this.filters, [nestedContext.target]);

        let matchClause: Cypher.Clause;
        if (filterSubqueries.length > 0) {
            const predicate = Cypher.and(...this.filters.map((f) => f.getPredicate(nestedContext)));
            matchClause = Cypher.utils.concat(
                new Cypher.Match(matchPattern),
                ...filterSubqueries,
                new Cypher.With("*").where(predicate)
            );
        } else {
            const predicate = Cypher.and(...this.filters.map((f) => f.getPredicate(nestedContext)));
            matchClause = new Cypher.Match(matchPattern).where(predicate);
        }

        const relVar = new Cypher.Relationship();

        const relDirection = this.relationship.getCypherDirection();

        const connectPattern = new Cypher.Pattern(context.target)
            .related(relVar, { direction: relDirection, type: this.relationship.type })
            .to(nestedContext.target);

        // TODO: find a better way to do this pls
        const connectContext = context.push({ target: nestedContext.target, relationship: relVar });

        const connectClause = new Cypher.Create(connectPattern);

        const setParams = Array.from(this.inputFields.values()).flatMap((input) => {
            return input.getSetParams(connectContext);
        });
        connectClause.set(...setParams);

        const mutationSubqueries = Array.from(this.inputFields.values()).flatMap((input) => {
            return input.getSubqueries(connectContext);
        });

        const clauses = Cypher.utils.concat(
            matchClause,
            ...mutationSubqueries,
            connectClause,
            ...this.getProjectionClause(nestedContext)
        );

        return { projectionExpr: context.returnVariable, clauses: [clauses] };
    }

    private getProjectionClause(context: QueryASTContext): Cypher.Clause[] {
        return this.projectionOperations.map((operationField) => {
            return Cypher.utils.concat(...operationField.transpile(context).clauses);
        });
    }
}
