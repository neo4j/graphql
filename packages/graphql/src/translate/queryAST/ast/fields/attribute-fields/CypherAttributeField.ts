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
import type { AttributeAdapter } from "../../../../../schema-model/attribute/model-adapters/AttributeAdapter";
import { CypherAnnotationSubqueryGenerator } from "../../../cypher-generators/CypherAnnotationSubqueryGenerator";
import type { QueryASTContext } from "../../QueryASTContext";
import type { QueryASTNode } from "../../QueryASTNode";
import type { Field } from "../Field";
import { AttributeField } from "./AttributeField";

// Should Cypher be an operation?
// TODO: Top Level Cypher are currently operations, deprecate this in favor of the operation approach.
export class CypherAttributeField extends AttributeField {
    protected customCypherVar = new Cypher.Node(); // TODO: should be from context scope
    protected projection: Record<string, string> | undefined;
    protected nestedFields: Field[] | undefined;
    protected rawArguments: Record<string, any>;
    protected extraParams: Record<string, any>;

    constructor({
        alias,
        attribute,
        projection,
        nestedFields,
        rawArguments = {},
        extraParams = {},
    }: {
        alias: string;
        attribute: AttributeAdapter;
        projection?: Record<string, string>;
        nestedFields?: Field[];
        rawArguments: Record<string, any>;
        extraParams: Record<string, any>;
    }) {
        super({ alias, attribute });
        this.projection = projection;
        this.nestedFields = nestedFields;
        this.rawArguments = rawArguments;
        this.extraParams = extraParams;
    }

    public getChildren(): QueryASTNode[] {
        return [...super.getChildren(), ...(this.nestedFields || [])];
    }

    public getProjectionField(_variable: Cypher.Variable): string | Record<string, Cypher.Expr> {
        return { [this.alias]: this.customCypherVar };
    }

    public getSubqueries(context: QueryASTContext): Cypher.Clause[] {
        const scope = context.getTargetScope();

        scope.set(this.attribute.name, this.customCypherVar);

        const cypherGenerator = new CypherAnnotationSubqueryGenerator({
            context,
            attribute: this.attribute,
        });

        const subquery = cypherGenerator.createSubqueryForCypherAnnotation({
            projectionFields: this.projection,
            nestedFields: this.nestedFields,
            rawArguments: this.rawArguments,
            extraParams: this.extraParams,
        });

        return [subquery];
    }

    public isCypherField(): boolean {
        return true;
    }
}
