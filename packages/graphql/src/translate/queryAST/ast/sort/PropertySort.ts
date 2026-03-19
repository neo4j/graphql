/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type Cypher from "@neo4j/cypher-builder";
import type { AttributeAdapter } from "../../../../schema-model/attribute/model-adapters/AttributeAdapter";
import type { QueryASTContext } from "../QueryASTContext";
import type { QueryASTNode } from "../QueryASTNode";
import type { SortField } from "./Sort";
import { Sort } from "./Sort";

export class PropertySort extends Sort {
    private attribute: AttributeAdapter;
    private direction: Cypher.Order;

    constructor({ attribute, direction }: { attribute: AttributeAdapter; direction: Cypher.Order }) {
        super();
        this.attribute = attribute;
        this.direction = direction;
    }

    public getChildren(): QueryASTNode[] {
        return [];
    }

    public print(): string {
        return `${super.print()} <${this.attribute.name}>`;
    }

    public getSortFields(
        context: QueryASTContext,
        variable: Cypher.Variable | Cypher.Property,
        sortByDatabaseName = true
    ): SortField[] {
        const attributeName = sortByDatabaseName ? this.attribute.databaseName : this.attribute.name;

        const nodeProperty = variable.property(attributeName);
        return [[nodeProperty, this.direction]];
    }

    public getProjectionField(_context: QueryASTContext): string | Record<string, Cypher.Expr> {
        if (this.attribute.databaseName !== this.attribute.name) return {};
        return this.attribute.databaseName;
    }
}
