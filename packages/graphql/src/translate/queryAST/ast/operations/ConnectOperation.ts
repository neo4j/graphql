/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import Cypher from "@neo4j/cypher-builder";
import type { ConcreteEntityAdapter } from "../../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { RelationshipAdapter } from "../../../../schema-model/relationship/model-adapters/RelationshipAdapter";
import { filterTruthy } from "../../../../utils/utils";
import { checkEntityAuthentication } from "../../../authorization/check-authentication";
import { getEntityLabels } from "../../utils/create-node-from-entity";
import { isConcreteEntity } from "../../utils/is-concrete-entity";
import { wrapSubqueriesInCypherCalls } from "../../utils/wrap-subquery-in-calls";
import type { QueryASTContext } from "../QueryASTContext";
import type { QueryASTNode } from "../QueryASTNode";
import type { Filter } from "../filters/Filter";
import type { AuthorizationFilters } from "../filters/authorization-filters/AuthorizationFilters";
import type { InputField } from "../input-fields/InputField";
import { ParamInputField } from "../input-fields/ParamInputField";
import type { SelectionPattern } from "../selection/SelectionPattern/SelectionPattern";
import { MutationOperation, type OperationTranspileResult } from "./operations";

export class ConnectOperation extends MutationOperation {
    public readonly target: ConcreteEntityAdapter;
    public readonly relationship: RelationshipAdapter;

    private selectionPattern: SelectionPattern;
    protected readonly authFilters: AuthorizationFilters[] = [];
    protected readonly sourceAuthFilters: AuthorizationFilters[] = [];

    public readonly inputFields: Map<string, InputField> = new Map();
    private filters: Filter[] = [];

    private nestedContext: QueryASTContext | undefined;

    constructor({
        target,
        relationship,
        selectionPattern,
    }: {
        target: ConcreteEntityAdapter;
        selectionPattern: SelectionPattern;
        relationship: RelationshipAdapter;
    }) {
        super();
        this.target = target;
        this.relationship = relationship;
        this.selectionPattern = selectionPattern;
    }

    public getChildren(): QueryASTNode[] {
        return filterTruthy([
            this.selectionPattern,
            ...this.filters,
            ...this.authFilters,
            ...this.sourceAuthFilters,
            ...this.inputFields.values(),
        ]);
    }

    public print(): string {
        return `${super.print()} <${this.target.name}>`;
    }

    public addAuthFilters(...filter: AuthorizationFilters[]) {
        this.authFilters.push(...filter);
    }
    public addSourceAuthFilters(...filter: AuthorizationFilters[]) {
        this.sourceAuthFilters.push(...filter);
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

    public addFilters(...filters: Filter[]): void {
        this.filters.push(...filters);
    }

    public getAuthorizationSubqueries(_context: QueryASTContext): Cypher.Clause[] {
        const nestedContext = this.nestedContext;

        if (!nestedContext) {
            throw new Error(
                "Error parsing query, nested context not available, need to call transpile first. Please contact support"
            );
        }

        return [...this.inputFields.values()].flatMap((inputField) => {
            return inputField.getAuthorizationSubqueries(nestedContext);
        });
    }

    public transpile(context: QueryASTContext): OperationTranspileResult {
        if (!context.hasTarget()) {
            throw new Error("No parent node found!");
        }
        const { nestedContext } = this.selectionPattern.apply(context);
        this.nestedContext = nestedContext;

        checkEntityAuthentication({
            context: nestedContext.neo4jGraphQLContext,
            entity: this.target.entity,
            targetOperations: ["CREATE_RELATIONSHIP"],
        });
        if (isConcreteEntity(this.relationship.source)) {
            checkEntityAuthentication({
                context: nestedContext.neo4jGraphQLContext,
                entity: this.relationship.source.entity,
                targetOperations: ["CREATE_RELATIONSHIP"],
            });
        }
        this.inputFields.forEach((field) => {
            if (field.attachedTo === "node" && field instanceof ParamInputField) {
                checkEntityAuthentication({
                    context: nestedContext.neo4jGraphQLContext,
                    entity: this.target.entity,
                    targetOperations: ["CREATE_RELATIONSHIP"],
                    field: field.name,
                });
            }
        });

        const matchPattern = new Cypher.Pattern(nestedContext.target, {
            labels: getEntityLabels(this.target, context.neo4jGraphQLContext),
        });

        const filterSubqueries = wrapSubqueriesInCypherCalls(nestedContext, this.filters, [nestedContext.target]);
        filterSubqueries.push(
            ...this.authFilters
                .flatMap((authFilter) => {
                    const authSubqueries = authFilter.getSubqueriesBefore(nestedContext);
                    return authSubqueries;
                })
                .map((sq) => {
                    return new Cypher.Call(sq, [nestedContext.target]);
                })
            // TODO: Subqueries for BEFORE auth on CREATE_RELATIONSHIP source node
            // ...this.sourceAuthFilters
            //     .flatMap((authFilter) => {
            //         const authSubqueries = authFilter.getSubqueriesBefore(context);
            //         return authSubqueries;
            //     })
            //     .map((sq) => {
            //         return new Cypher.Call(sq, [context.target]);
            //     })
        );
        const afterFilterSubqueries: Cypher.Clause[] = [...this.authFilters, ...this.sourceAuthFilters]
            .flatMap((authFilter) => {
                const authSubqueries = authFilter.getSubqueriesAfter(nestedContext);
                return authSubqueries;
            })
            .map((sq) => {
                return new Cypher.Call(sq, [nestedContext.target]);
            });
        if (afterFilterSubqueries.length > 0) {
            afterFilterSubqueries.unshift(new Cypher.With("*"));
        }

        const allFilters = [...this.authFilters, ...this.filters];
        const predicate = Cypher.and(...allFilters.map((f) => f.getPredicate(nestedContext)));
        let matchClause: Cypher.Clause;
        if (filterSubqueries.length > 0) {
            matchClause = Cypher.utils.concat(
                new Cypher.Match(matchPattern),
                ...filterSubqueries,
                new Cypher.With("*").where(predicate)
            );
        } else {
            matchClause = new Cypher.Match(matchPattern).where(predicate);
        }

        const relVar = new Cypher.Relationship();

        const relDirection = this.relationship.cypherDirectionFromRelDirection();

        const connectPattern = new Cypher.Pattern(context.target)
            .related(relVar, { direction: relDirection, type: this.relationship.type })
            .to(nestedContext.target);

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
            ...this.getAuthorizationClauses(nestedContext), // THESE ARE "BEFORE" AUTH
            // TODO: validations for BEFORE auth on CREATE_RELATIONSHIP source node
            // ...this.getSourceAuthorizationClausesBefore(context), // THESE ARE "BEFORE" AUTH
            ...mutationSubqueries,
            connectClause,
            ...afterFilterSubqueries,
            ...this.getAuthorizationClausesAfter(nestedContext), // THESE ARE "AFTER" AUTH
            ...this.getSourceAuthorizationClausesAfter(context) // ONLY RUN "AFTER" AUTH ON THE SOURCE NODE
        );

        const callClause = new Cypher.Call(clauses, [context.target]);

        return {
            projectionExpr: context.returnVariable,
            clauses: [callClause],
        };
    }

    private getAuthorizationClauses(context: QueryASTContext): Cypher.Clause[] {
        const { validations } = this.transpileAuthClauses(context);
        if (!validations.length) {
            return [];
        }
        return validations;
    }

    private getAuthorizationClausesAfter(context: QueryASTContext): Cypher.Clause[] {
        const validationsAfter: Cypher.VoidProcedure[] = [];
        for (const authFilter of this.authFilters) {
            const validationAfter = authFilter.getValidation(context, "AFTER");
            if (validationAfter) {
                validationsAfter.push(validationAfter);
            }
        }

        if (validationsAfter.length > 0) {
            return [new Cypher.With("*"), ...validationsAfter];
        }
        return [];
    }

    private getSourceAuthorizationClausesAfter(context: QueryASTContext): Cypher.Clause[] {
        const validationsAfter: Cypher.VoidProcedure[] = [];
        for (const authFilter of this.sourceAuthFilters) {
            const validationAfter = authFilter.getValidation(context, "AFTER");
            if (validationAfter) {
                validationsAfter.push(validationAfter);
            }
        }

        if (validationsAfter.length > 0) {
            return [new Cypher.With("*"), ...validationsAfter];
        }
        return [];
    }

    // TODO: source node BEFORE validations on CREATE_RELATIONSHIP ???
    private getSourceAuthorizationClausesBefore(context: QueryASTContext): Cypher.Clause[] {
        const validationsBefore: Cypher.VoidProcedure[] = [];
        for (const authFilter of this.sourceAuthFilters) {
            const validationBefore = authFilter.getValidation(context, "BEFORE");
            if (validationBefore) {
                validationsBefore.push(validationBefore);
            }
        }

        if (validationsBefore.length > 0) {
            return [new Cypher.With("*"), ...validationsBefore];
        }
        return [];
    }

    private transpileAuthClauses(context: QueryASTContext): {
        selections: (Cypher.With | Cypher.Match)[];
        subqueries: Cypher.Clause[];
        predicates: Cypher.Predicate[];
        validations: Cypher.VoidProcedure[];
    } {
        const selections: (Cypher.With | Cypher.Match)[] = [];
        const subqueries: Cypher.Clause[] = [];
        const predicates: Cypher.Predicate[] = [];
        const validations: Cypher.VoidProcedure[] = [];
        for (const authFilter of this.authFilters) {
            const extraSelections = authFilter.getSelection(context);
            const authSubqueries = authFilter.getSubqueries(context);
            const validation = authFilter.getValidation(context, "BEFORE");

            if (extraSelections) {
                selections.push(...extraSelections);
            }
            if (authSubqueries) {
                subqueries.push(...authSubqueries);
            }

            if (validation) {
                validations.push(validation);
            }
        }

        return { selections, subqueries, predicates, validations };
    }
}
