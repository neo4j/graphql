import { CypherContext } from "./CypherContext";

type CypherResult = {
    cypher: string;
    params: Record<string, string>;
};

export abstract class CypherASTElement {
    protected children: Array<CypherASTNode> = [];
}

export abstract class CypherASTRoot extends CypherASTElement {
    protected addStatement<C extends CypherASTNode>(astNode: C): C {
        this.children.push(astNode);
        return astNode;
    }

    public getRoot(): CypherASTRoot {
        return this;
    }

    public build(): CypherResult {
        const context = this.getContext();
        const cypher = this.getCypher(context);
        return {
            cypher: cypher,
            params: context.getParams(),
        };
    }

    public getCypher(context: CypherContext, separator = "\n"): string {
        const result = this.children
            .map((value) => {
                return value.getCypher(context);
            })
            .join(separator);
        return result;
    }

    protected getContext(): CypherContext {
        return new CypherContext();
    }
}

export abstract class CypherASTNode extends CypherASTElement {
    protected parent: CypherASTNode | CypherASTRoot;

    constructor(parent: CypherASTNode | CypherASTRoot) {
        super();
        this.parent = parent;
    }

    protected addStatement<C extends CypherASTNode>(astNode: C): C {
        this.children.push(astNode);
        astNode.parent = this;
        return astNode;
    }

    public getCypher(context: CypherContext, separator = "\n"): string {
        return this.children
            .map((value) => {
                return value.getCypher(context);
            })
            .join(separator);
    }

    public getRoot(): CypherASTRoot {
        return this.parent.getRoot();
    }
}
