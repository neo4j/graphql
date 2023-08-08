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
import { AttributeField } from "./AttributeField";
import type { AttributeAdapter } from "../../../../../schema-model/attribute/model-adapters/AttributeAdapter";

// Should Cypher be an operation?
export class CypherAttributeField extends AttributeField {
    private customCypherVar = new Cypher.Node(); // Using node only to keep consistency with tck
    private projection: Record<string, string> | undefined;

    constructor({
        alias,
        attribute,
        projection,
    }: {
        alias: string;
        attribute: AttributeAdapter;
        projection: Record<string, string> | undefined;
    }) {
        super({ alias, attribute });
        this.projection = projection;
    }

    public getProjectionField(_variable: Cypher.Variable): string | Record<string, Cypher.Expr> {
        return { [this.alias]: this.customCypherVar };
    }

    public getSubqueries(node: Cypher.Node): Cypher.Clause[] {
        const cypherAnnotation = this.attribute.annotations.cypher;
        if (!cypherAnnotation) throw new Error("Missing Cypher Annotation on Cypher field");

        const innerAlias = new Cypher.With([node, "this"]);
        const cypherSubquery = new Cypher.RawCypher(cypherAnnotation.statement);

        const columnName = "a"; // TODO: after schema model refactor is merged
        const returnVar = new Cypher.NamedNode(columnName);

        let projection: Cypher.Expr = this.customCypherVar;
        if (this.projection) {
            projection = new Cypher.MapProjection(this.customCypherVar);
            for (const [alias, name] of Object.entries(this.projection)) {
                if (alias === name) projection.set(alias);
                else {
                    projection.set({
                        [alias]: this.customCypherVar.property(name),
                    });
                }
            }
        }

        const subquery = new Cypher.Call(Cypher.concat(innerAlias, cypherSubquery))
            .innerWith(node)
            .with([returnVar, this.customCypherVar])
            .return([Cypher.head(Cypher.collect(projection)), this.customCypherVar]);

        return [subquery];
    }
}
