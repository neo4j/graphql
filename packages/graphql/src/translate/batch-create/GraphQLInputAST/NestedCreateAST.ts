import type { RelationField } from "../../../types";
import type { Visitor, INestedCreateAST } from "./types";
import type { Node } from "../../../classes";
import { AST } from "./AST";

export class NestedCreateAST extends AST implements INestedCreateAST {
    node: Node;
    parent: Node;
    nodeProperties: string[];
    edgeProperties: string[];
    relationshipPropertyPath: string;
    relationship: [RelationField | undefined, Node[]];

    constructor(
        node: Node,
        parent: Node,
        nodeProperties: string[],
        edgeProperties: string[],
        relationshipPropertyPath: string,
        relationship: [RelationField | undefined, Node[]]
    ) {
        super();
        this.node = node;
        this.parent = parent;
        this.nodeProperties = nodeProperties;
        this.edgeProperties = edgeProperties;
        this.relationshipPropertyPath = relationshipPropertyPath;
        this.relationship = relationship;
    }

    accept<R>(visitor: Visitor<R>): R {
        return visitor.visitNestedCreate(this);
    }
}