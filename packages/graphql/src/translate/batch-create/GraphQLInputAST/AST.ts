import type { IAST, Visitor } from "./types";

export class AST implements IAST {
    childrens: IAST[] = [];

    addChildren(node: IAST): void {
        this.childrens.push(node);
    }

    accept<R>(visitor: Visitor<R>): R {
        return visitor.visitNode(this);
    }
} 