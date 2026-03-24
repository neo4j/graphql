/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import Cypher from "@neo4j/cypher-builder";
import type { AttributeAdapter } from "../../../../../schema-model/attribute/model-adapters/AttributeAdapter";
import { apocWrapper } from "../../../../utils/apoc-wrapper";
import { type QueryASTContext } from "../../QueryASTContext";
import { ParamInputField } from "../ParamInputField";

export class PushInputField extends ParamInputField {
    constructor({
        attribute,
        attachedTo,
        inputValue,
    }: {
        attribute: AttributeAdapter;
        attachedTo: "node" | "relationship";
        inputValue: unknown;
    }) {
        super({ attribute, attachedTo, inputValue });
    }

    public getPredicate(queryASTContext: QueryASTContext<Cypher.Node>): Cypher.Predicate | undefined {
        const expr = this.getLeftExpression(queryASTContext);
        return apocWrapper.validatePredicate(Cypher.isNull(expr), `Property ${this.attribute.name} cannot be NULL`);
    }

    protected getRightExpression(
        queryASTContext: QueryASTContext<Cypher.Node>
    ): Exclude<Cypher.Expr, Cypher.Map | Cypher.MapProjection> {
        const pushedValue = super.getRightExpression(queryASTContext);
        return Cypher.plus(this.getLeftExpression(queryASTContext), pushedValue);
    }
}
