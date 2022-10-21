import type { Visitor, ICreateAST } from "./types";
import type { Node } from "../../../classes";
import { AST } from "./AST";

export class CreateAST extends AST implements ICreateAST {
    nodeProperties: string[];
    node: Node;

    constructor(nodeProperties: string[], node: Node) {
        super();
        this.nodeProperties = nodeProperties;
        this.node = node;
    }

    accept<R>(visitor: Visitor<R>): R {
        return visitor.visitCreate(this);
    }
}