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
import type { QueryASTContext } from "../../QueryASTContext";
import { PropertyFilter } from "../property-filters/PropertyFilter";

export class AuthPropertyFilter extends PropertyFilter {
    public getPredicate(queryASTContext: QueryASTContext): Cypher.Predicate {
        const predicate = super.getPredicate(queryASTContext);

        const isCypherVariable =
            this.comparisonValue instanceof Cypher.Variable ||
            this.comparisonValue instanceof Cypher.Property ||
            this.comparisonValue instanceof Cypher.Param;

        if (isCypherVariable) {
            return Cypher.and(Cypher.isNotNull(this.comparisonValue as any), predicate);
        }
        return predicate;
    }

    protected getOperation(prop: Cypher.Property): Cypher.ComparisonOp {
        const isCypherVariable =
            this.comparisonValue instanceof Cypher.Variable ||
            this.comparisonValue instanceof Cypher.Property ||
            this.comparisonValue instanceof Cypher.Param;

        const comparisonParam: any = isCypherVariable ? this.comparisonValue : new Cypher.Param(this.comparisonValue);

        return this.createBaseOperation({
            operator: this.operator,
            property: prop,
            param: comparisonParam,
        });
    }
}
