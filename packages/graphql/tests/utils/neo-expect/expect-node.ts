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
import type { UniqueType } from "../graphql-types";
import type { CypherExecute } from "./neo-expect";
import { NeoAssertionError, NeoExpect } from "./neo-expect";

export class NeoExpectNode extends NeoExpect {
    private target: UniqueType | string;
    private targetVar = new Cypher.Node();
    private result = new Cypher.NamedVariable("result");

    constructor(executor: CypherExecute, target: UniqueType | string) {
        super(executor);
        this.target = target;
    }

    public async count(expected: number): Promise<void> {
        const count = await this.getCount();
        if (count !== expected) {
            throw new NeoAssertionError(`Incorrect count, expected ${expected}, found ${count}`);
        }
    }

    public async toExists(): Promise<void> {
        const count = await this.getCount();
        if (count === 0) {
            throw new NeoAssertionError(`${this.target} doesn't exists`);
        }
    }

    public async toNotExist(): Promise<void> {
        const count = await this.getCount();
        if (count !== 0) {
            throw new NeoAssertionError(`${this.target} exists`);
        }
    }

    /** Uses jest.toEqual matcher over the result of the type query */
    public async toEqual(expectation: any[]): Promise<void> {
        const result = await this.getAll();
        expect(result).toEqual(expectation);
    }

    /** Return all the elements matching target. Result is parsed to JS types */
    private async getAll(): Promise<Record<string, any>[]> {
        const pattern = this.getPattern();

        const clause = new Cypher.Match(pattern).return([new Cypher.MapProjection(this.targetVar, "*"), this.result]);
        const result = await this.executeCypherClause(clause);

        return this.parseColumn(result, this.result);
    }

    private async getCount(): Promise<number> {
        const pattern = this.getPattern();

        const clause = new Cypher.Match(pattern).return([Cypher.count(this.targetVar), this.result]);
        const res = await this.executeCypherClause(clause);

        return this.parseColumnFirst<number>(res, this.result);
    }

    private getPattern(): Cypher.Pattern {
        return new Cypher.Pattern(this.targetVar, {
            labels: [`${this.target}`],
        });
    }
}
