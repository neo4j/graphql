import * as Cypher from "@neo4j/cypher-builder";
import type * as neo4j from "neo4j-driver";
import { isNeoInt } from "../../../src/utils/utils";
import type { UniqueType } from "../graphql-types";

type CypherExecute = (query: string, params: Record<string, unknown>) => Promise<neo4j.QueryResult>;

export type ExpectationTarget = {
    from: UniqueType | string;
    to?: UniqueType | string;
    relationship?: string;
};

export class NeoAssertionError extends Error {}

export class NeoExpectCypher {
    private cypher: string;
    private executor: CypherExecute;
    private params: Record<string, unknown>;

    constructor(
        executor: CypherExecute,
        { cypher, params = {} }: { cypher: string; params?: Record<string, unknown> }
    ) {
        this.executor = executor;
        this.cypher = cypher;
        this.params = params;
    }

    /** Uses jest.toEqual matcher over the result of the type query */
    public async toEqual(expectation: Record<string, any>[]): Promise<void> {
        const result = await this.executeCypher(this.cypher, this.params);

        const rawResults = result.records.map((r) => r.toObject());
        const parsedResult = this.parseResult(rawResults);

        expect(parsedResult).toEqual(expectation);
    }

    protected executeCypher(query: string, params: Record<string, unknown> = {}): Promise<neo4j.QueryResult> {
        return this.executor(query, params);
    }

    protected parseResult(rawResults: neo4j.RecordShape[]): Record<string, any>[] {
        return rawResults.map((rawObject) => {
            return Object.entries(rawObject).reduce((acc, [key, value]) => {
                if (isNeoInt(value)) {
                    acc[key] = value.toNumber();
                } else {
                    acc[key] = value;
                }

                return acc;
            }, {});
        });
    }
}

/** A tool to make expectations over a Neo4j database */
export class NeoExpect {
    private executor: CypherExecute;
    private target: ExpectationTarget;

    private from = new Cypher.Node();
    private to = new Cypher.Node();
    private relationship = new Cypher.Relationship();
    private result = new Cypher.NamedVariable("result");

    constructor(executor: CypherExecute, target: ExpectationTarget) {
        this.executor = executor;
        this.target = target;
    }

    public async count(expected: number): Promise<void> {
        const count = await this.getCount();
        if (count !== expected) {
            throw new NeoAssertionError("Incorrect count");
        }
    }

    public async toExists(): Promise<void> {
        const count = await this.getCount();
        if (count === 0) {
            throw new NeoAssertionError(`${this.target.from} doesn't exists`);
        }
    }

    public async toNotExist(): Promise<void> {
        const count = await this.getCount();
        if (count !== 0) {
            throw new NeoAssertionError(`${this.target.from} exists`);
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

        const clause = new Cypher.Match(pattern).return([new Cypher.MapProjection(this.from, "*"), this.result]);
        const res = await this.executeCypherClause(clause);

        const rawResults = res.records.map((r) => r.toObject()["result"]);
        return rawResults.map((rawObject) => {
            return Object.entries(rawObject).reduce((acc, [key, value]) => {
                if (isNeoInt(value)) {
                    acc[key] = value.toNumber();
                } else {
                    acc[key] = value;
                }

                return acc;
            }, {});
        });
    }

    private async getCount(): Promise<number> {
        const clause = new Cypher.Match(this.getPattern()).return([Cypher.count("*"), this.result]);
        const res = await this.executeCypherClause(clause);

        const countResult: neo4j.Integer = res.records[0]?.toObject()["result"];
        return countResult.toNumber();
    }

    private getPattern(): Cypher.Pattern {
        const pattern = new Cypher.Pattern(this.from, {
            labels: [`${this.target.from}`],
        });

        if (this.target.to) {
            pattern.related(this.relationship, { type: this.target.relationship }).to(this.to, {
                labels: [`${this.target.to}`],
            });
        }

        return pattern;
    }

    private executeCypher(query: string, params: Record<string, unknown> = {}): Promise<neo4j.QueryResult> {
        return this.executor(query, params);
    }

    private executeCypherClause(clause: Cypher.Clause): Promise<neo4j.QueryResult> {
        const { cypher, params } = clause.build();
        return this.executeCypher(cypher, params);
    }
}
