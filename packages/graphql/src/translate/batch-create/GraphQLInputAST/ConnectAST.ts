import type { TreeDescriptor } from "../types";
import type { Visitor, IConnectAST } from "./types";
import type { Node } from "../../../classes";
import { AST } from "./AST";

export class ConnectAST extends AST implements IConnectAST {
    parent: Node;
    edgeProperties: string[];
    where: TreeDescriptor;
    connect: TreeDescriptor;

    constructor(parent: Node, edgeProperties: string[], where: TreeDescriptor, connect: TreeDescriptor) {
        super();
        this.parent = parent;
        this.edgeProperties = edgeProperties;
        this.where = where;
        this.connect = connect;
    }

    accept<R>(visitor: Visitor<R>): R {
        return visitor.visitConnect(this);
    }
}
