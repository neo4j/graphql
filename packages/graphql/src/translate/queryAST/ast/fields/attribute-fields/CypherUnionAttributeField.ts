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
import { CypherAttributeField } from "./CypherAttributeField";
import type { CypherUnionAttributePartial } from "./CypherUnionAttributePartial";
import { filterTruthy } from "../../../../../utils/utils";

// Should Cypher be an operation?
export class CypherUnionAttributeField extends CypherAttributeField {
    protected unionPartials: CypherUnionAttributePartial[];

    constructor({
        alias,
        attribute,
        projection,
        unionPartials,
        rawArguments = {},
        extraParams = {},
    }: {
        alias: string;
        attribute: AttributeAdapter;
        projection?: Record<string, string>;
        unionPartials: CypherUnionAttributePartial[];
        rawArguments: Record<string, any>;
        extraParams: Record<string, any>;
    }) {
        super({ alias, attribute, projection, nestedFields: [], rawArguments, extraParams });
        this.unionPartials = unionPartials;
    }

    public getChildren(): QueryASTNode[] {
        return [...super.getChildren(), ...this.unionPartials];
    }

    public getSubqueries(context: QueryASTContext): Cypher.Clause[] {
        const scope = context.getTargetScope();
        // by setting the return variable of this operation in the attribute scope, we can avoid duplicate the same cypher resolution for sorting and projection purposes
        scope.set(this.attribute.name, this.customCypherVar);

        // TODO: this logic may be needed in normal Cypher Fields
        // This handles nested subqueries for union cypher
        const nestedSubqueries = this.unionPartials.flatMap((p) => {
            const innerNode = new Cypher.Node();
            const nestedContext = context.push({
                target: innerNode,
                relationship: new Cypher.Relationship(),
            });

            const callSubqueries = p.getSubqueries(nestedContext).map((sq) => {
                return new Cypher.Call(sq).innerWith(innerNode);
            });
            if (callSubqueries.length === 0) return undefined;
            const withClause = new Cypher.With("*", [this.customCypherVar, innerNode]);
            return Cypher.concat(withClause, ...callSubqueries);
        });

        const cypherGenerator = new CypherAnnotationSubqueryGenerator({
            context,
            attribute: this.attribute,
        });

        // TODO: use different method
        const subquery = cypherGenerator.createSubqueryForCypherAnnotationUnion({
            // projectionFields: this.projection,
            nestedFields: this.nestedFields,
            rawArguments: this.rawArguments,
            subqueries: filterTruthy(nestedSubqueries),
            extraParams: this.extraParams,
            unionPartials: this.unionPartials,
        });

        return [subquery];
    }

    public isCypherField(): boolean {
        return true;
    }
}
