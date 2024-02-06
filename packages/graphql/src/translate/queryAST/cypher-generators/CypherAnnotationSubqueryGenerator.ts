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
import type { CypherAnnotation } from "../../../schema-model/annotation/CypherAnnotation";
import type { AttributeAdapter } from "../../../schema-model/attribute/model-adapters/AttributeAdapter";
import { QueryASTContext } from "../ast/QueryASTContext";
import type { Field } from "../ast/fields/Field";
import type { CypherUnionAttributePartial } from "../ast/fields/attribute-fields/CypherUnionAttributePartial";
import { assertIsCypherNode } from "../utils/assert-is-cypher-node";
import { wrapSubqueryInCall } from "../utils/wrap-subquery-in-call";
import { replaceArgumentsInStatement } from "../utils/replace-arguments-in-statement";

/** Variable exposed to the user in their custom cypher */
const CYPHER_TARGET_VARIABLE = new Cypher.NamedVariable("this");

export class CypherAnnotationSubqueryGenerator {
    private attribute: AttributeAdapter;
    private context: QueryASTContext;
    private cypherAnnotation: CypherAnnotation;
    private columnName: Cypher.Variable;
    private returnVariable: Cypher.Variable;

    constructor({ context, attribute }: { context: QueryASTContext; attribute: AttributeAdapter }) {
        const cypherAnnotation = attribute.annotations.cypher;
        if (!cypherAnnotation) {
            throw new Error("Missing Cypher Annotation on Cypher field");
        }
        this.cypherAnnotation = cypherAnnotation;
        this.attribute = attribute;
        this.context = context;

        this.columnName = new Cypher.NamedVariable(cypherAnnotation.columnName);
        this.returnVariable = context.getScopeVariable(attribute.name);
    }

    public createSubqueryForCypherAnnotation({
        rawArguments = {},
        extraParams = {},
        nestedFields,
        subqueries = [],
        projectionFields,
    }: {
        rawArguments?: Record<string, any>;
        extraParams?: Record<string, any>;
        nestedFields?: Field[];
        subqueries?: Cypher.Clause[];
        projectionFields?: Record<string, string>;
    }): Cypher.Clause {
        const statementSubquery = this.createCypherStatementSubquery({
            rawArguments,
            extraParams,
        });

        const nestedFieldsSubqueries = this.getNestedFieldsSubquery(nestedFields);

        const returnProjection = this.getProjectionExpression({
            fields: projectionFields,
            nestedFields,
        });
        const returnStatement = new Cypher.Return([returnProjection, this.returnVariable]);

        return Cypher.concat(statementSubquery, nestedFieldsSubqueries, ...subqueries, returnStatement);
    }

    public createSubqueryForCypherAnnotationUnion({
        rawArguments = {},
        extraParams = {},
        nestedFields,
        subqueries = [],
        unionPartials,
    }: {
        rawArguments?: Record<string, any>;
        extraParams?: Record<string, any>;
        nestedFields?: Field[];
        subqueries?: Cypher.Clause[];
        unionPartials: CypherUnionAttributePartial[];
    }) {
        const statementSubquery = this.createCypherStatementSubquery({
            rawArguments,
            extraParams,
        });

        const nestedFieldsSubqueries = this.getNestedFieldsSubquery(nestedFields);

        const unionPredicates = unionPartials.map((partial) => partial.getFilterPredicate(this.returnVariable));
        const unionPredicatesFilter = new Cypher.With("*").where(Cypher.or(...unionPredicates));

        const returnProjection = this.getProjectionExpressionForUnionPartials(unionPartials);
        const returnStatement = new Cypher.Return([returnProjection, this.returnVariable]);

        return Cypher.concat(
            statementSubquery,
            nestedFieldsSubqueries,
            unionPredicatesFilter,
            ...subqueries,
            returnStatement
        );
    }

    private createCypherStatementSubquery({
        rawArguments,
        extraParams,
    }: {
        rawArguments: Record<string, any>;
        extraParams: Record<string, any>;
    }): Cypher.Call {
        if (!this.context.hasTarget()) {
            throw new Error("No parent node found!");
        }
        const target = this.context.target;
        const aliasTargetToPublicTarget = new Cypher.With([target, CYPHER_TARGET_VARIABLE]);

        const statementCypherQuery = new Cypher.Raw((env) => {
            const statement = replaceArgumentsInStatement({
                env,
                definedArguments: this.attribute.args,
                rawArguments,
                statement: this.cypherAnnotation.statement,
            });

            return [statement, extraParams];
        });

        const statementSubquery = Cypher.concat(aliasTargetToPublicTarget, statementCypherQuery);

        const callStatement = new Cypher.Call(statementSubquery).innerWith(target);

        if (this.attribute.typeHelper.isScalar() || this.attribute.typeHelper.isEnum()) {
            callStatement.unwind([this.columnName, this.returnVariable]);
        } else {
            callStatement.with([this.columnName, this.returnVariable]);
        }

        return callStatement;
    }

    private getNestedFieldsSubquery(nestedFields: Field[] | undefined): Cypher.Clause | undefined {
        const target = this.returnVariable;
        if (!nestedFields) {
            return;
        }
        assertIsCypherNode(target);

        const nestedContext = new QueryASTContext({
            target,
            env: this.context.env,
            neo4jGraphQLContext: this.context.neo4jGraphQLContext,
        });

        const nodeProjectionSubqueries = nestedFields.flatMap((field) => {
            return field.getSubqueries(nestedContext).map((sq) => wrapSubqueryInCall(sq, target));
        });
        return Cypher.concat(...nodeProjectionSubqueries);
    }

    private getProjectionExpression({
        fields,
        nestedFields,
    }: {
        fields: Record<string, string> | undefined;
        nestedFields?: Field[];
    }): Cypher.Expr {
        let projection: Cypher.Expr = this.returnVariable;

        // nested fields are presents only if the attribute is an object or an abstract type, and they produce a different projection
        if (nestedFields) {
            projection = this.getNestedFieldsProjectionMap(nestedFields, this.returnVariable);
        } else if (fields) {
            projection = this.getFieldsProjectionMap(fields, this.returnVariable);
        }

        const collectedProjection = Cypher.collect(projection);

        if (!this.attribute.typeHelper.isList()) {
            return Cypher.head(collectedProjection);
        }
        return collectedProjection;
    }

    private getProjectionExpressionForUnionPartials(unionPartials: CypherUnionAttributePartial[]) {
        const caseClause = new Cypher.Case();

        for (const partial of unionPartials) {
            const projection = partial.getProjectionExpression(this.returnVariable);
            const predicate = partial.getFilterPredicate(this.returnVariable);
            caseClause.when(predicate).then(projection);
        }
        const collectedProjection = Cypher.collect(caseClause);

        if (!this.attribute.typeHelper.isList()) {
            return Cypher.head(collectedProjection);
        }
        return collectedProjection;
    }

    private getNestedFieldsProjectionMap(fields: Field[], fromVariable: Cypher.Variable): Cypher.MapProjection {
        const projection = new Cypher.MapProjection(fromVariable);

        for (const field of fields) {
            const fieldProjection = field.getProjectionField(fromVariable);
            projection.set(fieldProjection);
        }

        return projection;
    }

    private getFieldsProjectionMap(
        fields: Record<string, string>,
        fromVariable: Cypher.Variable
    ): Cypher.MapProjection {
        const projection = new Cypher.MapProjection(fromVariable);
        for (const [alias, name] of Object.entries(fields)) {
            if (alias === name) {
                projection.set(alias);
            } else {
                projection.set({
                    [alias]: fromVariable.property(name),
                });
            }
        }

        return projection;
    }
}
