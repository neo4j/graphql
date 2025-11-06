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
import { NeoAssertionError, NeoExpect, type CypherExecute } from "./neo-expect";

export class NeoExpectRelationship extends NeoExpect {
    private fromVar = new Cypher.Node();
    private toVar = new Cypher.Node();
    private relVar = new Cypher.Node();

    private from: UniqueType | string;
    private to: UniqueType | string;
    private type: string | undefined;

    private result = new Cypher.NamedVariable("result");

    constructor(
        executor: CypherExecute,
        from: UniqueType | string,
        to: UniqueType | string,
        relationshipType?: string
    ) {
        super(executor);
        this.from = from;
        this.to = to;
        this.type = relationshipType;
    }

    /** Uses jest.toEqual matcher over the result of the type query */
    public async toEqual(expectation: any[]): Promise<void> {
        const result = await this.getAll();
        try {
            expect(result).toEqual(expectation);
        } catch (err: any) {
            const typeStr = this.type ? `[${this.type}]` : "-";
            err.message = `Error on ${this.from} ${typeStr} ${this.to}\n\n ${err.message}`;
            throw err;
        }
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
            throw new NeoAssertionError(`Relationship ${this.from} - ${this.to} doesn't exists`);
        }
    }

    public async toNotExist(): Promise<void> {
        const count = await this.getCount();
        if (count !== 0) {
            throw new NeoAssertionError(`Relationship ${this.from} - ${this.to} exists`);
        }
    }

    private getPattern(): Cypher.Pattern {
        return new Cypher.Pattern(this.fromVar, {
            labels: [`${this.from}`],
        })
            .related(this.relVar, {
                type: this.type,
            })
            .to(this.toVar, {
                labels: [`${this.to}`],
            });
    }

    private async getCount(): Promise<number> {
        const pattern = this.getPattern();

        const clause = new Cypher.Match(pattern).return([Cypher.count(this.toVar), this.result]);
        const res = await this.executeCypherClause(clause);

        return this.parseColumnFirst<number>(res, this.result);
    }

    /** Return all the elements matching target. Result is parsed to JS types */
    private async getAll(): Promise<Record<string, any>[]> {
        const pattern = this.getPattern();

        const projection = new Cypher.Map({
            from: new Cypher.MapProjection(this.fromVar, "*"),
            to: new Cypher.MapProjection(this.toVar, "*"),
            relationship: new Cypher.MapProjection(this.relVar, "*"),
        });

        const clause = new Cypher.Match(pattern).return([projection, this.result]);
        const result = await this.executeCypherClause(clause);

        return this.parseColumn(result, this.result);
    }
}
