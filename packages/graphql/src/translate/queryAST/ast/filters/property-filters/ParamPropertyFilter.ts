/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import Cypher from "@neo4j/cypher-builder";
import type { AttributeAdapter } from "../../../../../schema-model/attribute/model-adapters/AttributeAdapter";
import type { RelationshipAdapter } from "../../../../../schema-model/relationship/model-adapters/RelationshipAdapter";
import type { QueryASTContext } from "../../QueryASTContext";
import type { FilterOperator } from "../Filter";
import { PropertyFilter } from "./PropertyFilter";

type CypherVariable = Cypher.Variable | Cypher.Property | Cypher.Param;

/** A property which comparison has already been parsed into a Param */
export class ParamPropertyFilter extends PropertyFilter {
    protected comparisonValue: CypherVariable;

    constructor({
        attribute,
        comparisonValue,
        operator,
        attachedTo = "node",
        relationship,
        caseInsensitive,
    }: {
        attribute: AttributeAdapter;
        comparisonValue: CypherVariable;
        operator: FilterOperator;
        attachedTo?: "node" | "relationship";
        relationship?: RelationshipAdapter;
        caseInsensitive?: boolean;
    }) {
        super({
            attribute,
            operator,
            relationship,
            attachedTo,
            comparisonValue,
            caseInsensitive,
        });
        this.comparisonValue = comparisonValue;
    }

    public getPredicate(queryASTContext: QueryASTContext): Cypher.Predicate {
        const predicate = super.getPredicate(queryASTContext);

        // NOTE: Should this check be a different Filter?
        return Cypher.and(Cypher.isNotNull(this.comparisonValue), predicate);
    }

    protected getOperation(prop: Cypher.Property): Cypher.ComparisonOp {
        const comparisonParam = this.comparisonValue;

        return this.createBaseOperation({
            operator: this.operator,
            property: prop,
            param: comparisonParam,
        });
    }
}
