import type { TreeDescriptor } from "../types";
import type { Visitor, IConnectOrCreateAST } from "./types";
import type { Node } from "../../../classes";
import { AST } from "./AST";

export class ConnectOrCreateAST extends AST implements IConnectOrCreateAST {
    parent: Node;
    where: TreeDescriptor;
    onCreate: TreeDescriptor;

    constructor(parent: Node, where: TreeDescriptor, onCreate: TreeDescriptor) {
        super();
        this.parent = parent;
        this.where = where;
        this.onCreate = onCreate;
    }

    accept<R>(visitor: Visitor<R>): R {
        return visitor.visitConnectOrCreate(this);
    }
}