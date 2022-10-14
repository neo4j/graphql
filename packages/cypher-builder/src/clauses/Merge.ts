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

import type { CypherEnvironment } from "../Environment";
import type { RelationshipRef } from "../variables/RelationshipRef";
import { NodeRef } from "../variables/NodeRef";
import { MatchParams, Pattern } from "../Pattern";
import { Clause } from "./Clause";
import { OnCreate, OnCreateParam } from "./sub-clauses/OnCreate";
import { WithReturn } from "./mixins/WithReturn";
import { mixin } from "./utils/mixin";

export interface Merge extends WithReturn {}

@mixin(WithReturn)
export class Merge<T extends NodeRef | RelationshipRef = any> extends Clause {
    private pattern: Pattern<T>;
    private onCreateClause: OnCreate;

    constructor(element: T, params: MatchParams<T> = {}) {
        super();

        const addLabels = element instanceof NodeRef;
        const addLabelsOption = { labels: addLabels };
        this.pattern = new Pattern(element, {
            source: addLabelsOption,
            target: addLabelsOption,
        }).withParams(params);
        this.onCreateClause = new OnCreate(this);
    }

    public onCreate(...onCreateParams: OnCreateParam[]): this {
        this.onCreateClause.addParams(...onCreateParams);

        return this;
    }

    public getCypher(env: CypherEnvironment): string {
        const mergeStr = `MERGE ${this.pattern.getCypher(env)}`;
        const onCreateStatement = this.onCreateClause.getCypher(env);
        const separator = onCreateStatement ? "\n" : "";

        let returnCypher = "";
        if (this.returnStatement) {
            returnCypher = `\n${this.returnStatement.getCypher(env)}`;
        }

        return `${mergeStr}${separator}${onCreateStatement}${returnCypher}`;
    }
}
