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
import type { AttributeAdapter } from "../../../schema-model/attribute/model-adapters/AttributeAdapter";
import type { QueryASTContext } from "../../../translate/queryAST/ast/QueryASTContext";
import type { QueryASTNode } from "../../../translate/queryAST/ast/QueryASTNode";
import { InputField } from "../../../translate/queryAST/ast/input-fields/InputField";

export class UpdateProperty extends InputField {
    private value: unknown;
    private attribute: AttributeAdapter;

    constructor({
        value,
        attribute,
        attachedTo = "node",
    }: {
        value: unknown;
        attribute: AttributeAdapter;
        attachedTo: "node" | "relationship";
    }) {
        super(attribute.name, attachedTo);
        this.value = value;
        this.attribute = attribute;
    }

    public getChildren(): QueryASTNode[] {
        return [];
    }

    public getSetParams(queryASTContext: QueryASTContext<Cypher.Node>): Cypher.SetParam[] {
        const target = this.getTarget(queryASTContext);

        const targetProperty = target.property(this.attribute.databaseName);
        const rightExpr = new Cypher.Param(this.value);
        const setField: Cypher.SetParam = [targetProperty, rightExpr];

        return [setField];
    }

    // private coerceReference(
    //     variable: Cypher.Variable | Cypher.Property
    // ): Exclude<Cypher.Expr, Cypher.Map | Cypher.MapProjection> {
    //     if (this.attribute.typeHelper.isSpatial()) {
    //         if (!this.attribute.typeHelper.isList()) {
    //             return Cypher.point(variable);
    //         }
    //         const comprehensionVar = new Cypher.Variable();
    //         const mapPoint = Cypher.point(comprehensionVar);
    //         return new Cypher.ListComprehension(comprehensionVar, variable).map(mapPoint);
    //     }
    //     return variable;
    // }

    // protected getTarget(queryASTContext: QueryASTContext<Cypher.Node>): Cypher.Node | Cypher.Relationship {
    //     const target = this.attachedTo === "node" ? queryASTContext.target : queryASTContext.relationship;
    //     if (!target) {
    //         throw new Error("No target found");
    //     }
    //     return target;
    // }

    // public getSetParams(_queryASTContext: QueryASTContext, _inputVariable?: Cypher.Variable): Cypher.SetParam[] {
    //     return [];
    // }
}
