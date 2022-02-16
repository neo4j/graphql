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

export abstract class CypherReference {
    public readonly prefix: string = "ref";
    public abstract getCypher(context: CypherContext): string;
}

export class CypherContext {
    private references: Map<CypherReference, string> = new Map();

    public getReferenceId(reference: CypherReference): string {
        const id = this.references.get(reference);
        if (!id) {
            return this.addReference(reference);
        }
        return id;
    }

    public getParams(): Record<string, string> {
        return {};
    }

    private addReference(reference: CypherReference): string {
        const refIndex = this.getNextReferenceIndex();
        const referenceId = `${reference.prefix}${refIndex}`;
        this.references.set(reference, referenceId);
        return referenceId;
    }

    private getNextReferenceIndex(): number {
        return this.references.size;
    }
}
