export abstract class CypherASTRoot {
    protected children: Array<CypherASTNode> = [];

    protected addStatement<C extends CypherASTNode>(astNode: C): C {
        this.children.push(astNode);
        astNode.parent = this;
        return astNode;
    }

    public getRoot(): CypherASTRoot {
        return this;
    }
}

export abstract class CypherASTNode {
    public abstract parent: CypherASTNode | CypherASTRoot;
    protected children: Array<CypherASTNode> = [];

    protected addStatement<C extends CypherASTNode>(astNode: C): C {
        this.children.push(astNode);
        astNode.parent = this;
        return astNode;
    }

    public abstract getCypher(context: CypherContext): string;

    public getRoot(): CypherASTRoot {
        return this.parent.getRoot();
    }
}

export interface CypherReference {
    getCypher(context: CypherContext): string;
}

export type CypherContext = {
    getReferenceId(reference: CypherReference): string;
};
