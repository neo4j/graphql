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

    public build(prefix?: string): CypherResult {
        const context = this.getContext(prefix);
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

    protected getContext(prefix?: string): CypherContext {
        return new CypherContext(prefix);
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

    public build(prefix?: string): CypherResult {
        const root = this.getRoot();
        return root.build(prefix);
    }

    public getRoot(): CypherASTRoot {
        return this.parent.getRoot();
    }
}
