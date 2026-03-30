/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type Cypher from "@neo4j/cypher-builder";
import type { AttributeAdapter } from "../../../../../schema-model/attribute/model-adapters/AttributeAdapter";
import { coalesceValueIfNeeded } from "../../filters/utils/coalesce-if-needed";
import type { QueryASTNode } from "../../QueryASTNode";
import { Field } from "../Field";

export class AttributeField extends Field {
    protected attribute: AttributeAdapter;

    constructor({ alias, attribute }: { alias: string; attribute: AttributeAdapter }) {
        super(alias);
        this.attribute = attribute;
    }

    public getChildren(): QueryASTNode[] {
        return [];
    }

    public getFieldName(): string {
        return this.attribute.name;
    }

    protected getCypherExpr(target: Cypher.Variable): Cypher.Expr {
        return target.property(this.attribute.databaseName);
    }

    public getProjectionField(variable: Cypher.Variable): string | Record<string, Cypher.Expr> {
        const variableProperty = variable.property(this.attribute.databaseName);
        return this.createAttributeProperty(variableProperty);
    }

    private createAttributeProperty(variableProperty: Cypher.Property): string | Record<string, Cypher.Expr> {
        if (this.alias !== this.attribute.databaseName || this.attribute.annotations.coalesce) {
            return { [this.alias]: coalesceValueIfNeeded(this.attribute, variableProperty) };
        }
        return this.attribute.databaseName;
    }
}
