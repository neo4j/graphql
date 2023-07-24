import type Cypher from "@neo4j/cypher-builder";

export class CypherTreeContext {
    public variables: Cypher.Variable[];
    public target: Cypher.Variable;

    constructor({ target, vars }: { target: Cypher.Variable; vars?: Cypher.Variable[] }) {
        this.target = target;
        this.variables = vars || [];
    }

    public push(...vars: Cypher.Variable[]): CypherTreeContext {
        return new CypherTreeContext({
            target: this.target,
            vars: [...this.variables, ...vars],
        });
    }
}
