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

import type { AttributeAdapter } from "../../../../../schema-model/attribute/model-adapters/AttributeAdapter";
import type { QueryASTContext } from "../../QueryASTContext";
import type { QueryASTNode } from "../../QueryASTNode";
import { Field } from "../Field";
import type Cypher from "@neo4j/cypher-builder";

export class AttributeField extends Field {
    protected attribute: AttributeAdapter;

    constructor({
        alias,
        attribute,
        attachedTo,
    }: {
        alias: string;
        attribute: AttributeAdapter;
        attachedTo?: "node" | "relationship";
    }) {
        super({ alias, attachedTo });
        this.attribute = attribute;
    }

    public getChildren(): QueryASTNode[] {
        return [];
    }

    protected getCypherExpr(target: Cypher.Variable): Cypher.Expr {
        return target.property(this.attribute.databaseName);
    }
    protected getPropertyRef(queryASTContext: QueryASTContext): Cypher.Property {
        return this.getVariableRef(queryASTContext).property(this.attribute.databaseName);
    }

    public getProjectionField(queryASTContext: QueryASTContext): string | Record<string, Cypher.Expr> {
        const variableProperty = this.getPropertyRef(queryASTContext);
        return this.createAttributeProperty(variableProperty);
    }

    private createAttributeProperty(variableProperty: Cypher.Property): string | Record<string, Cypher.Expr> {
        if (this.alias !== this.attribute.databaseName) {
            return { [this.alias]: variableProperty };
        }
        return this.attribute.databaseName;
    }
}
