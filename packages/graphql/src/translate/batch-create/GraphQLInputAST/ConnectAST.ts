import type { TreeDescriptor } from "../types";
import type { RelationField } from "../../../types";
import type { Visitor, IConnectAST } from "./types";
import type { Node } from "../../../classes";
import { AST } from "./AST";

export class ConnectAST extends AST implements IConnectAST {
    node: Node;
    parent: Node;
    edgeProperties: string[];
    where: TreeDescriptor;
    connect: TreeDescriptor;
    relationshipPropertyPath: string;
    relationship: [RelationField | undefined, Node[]];

    constructor(
        node: Node,
        parent: Node,
        edgeProperties: string[],
        where: TreeDescriptor,
        connect: TreeDescriptor,
        relationshipPropertyPath: string,
        relationship: [RelationField | undefined, Node[]]
    ) {
        super();
        this.node = node;
        this.parent = parent;
        this.edgeProperties = edgeProperties;
        this.where = where;
        this.connect = connect;
        this.relationshipPropertyPath = relationshipPropertyPath;
        this.relationship = relationship;
    }

    accept<R>(visitor: Visitor<R>): R {
        return visitor.visitConnect(this);
    }
}
