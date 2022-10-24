import type { RelationField } from "../../../types";
import type { Visitor, INestedCreateAST } from "./types";
import type { Node, Relationship } from "../../../classes";
import { AST } from "./AST";

export class NestedCreateAST extends AST implements INestedCreateAST {
    node: Node;
    parent: Node;
    nodeProperties: string[];
    edgeProperties: string[];
    relationshipPropertyPath: string;
    relationship: [RelationField | undefined, Node[]];
    edge: Relationship | undefined;

    constructor(
        node: Node,
        parent: Node,
        nodeProperties: string[],
        edgeProperties: string[],
        relationshipPropertyPath: string,
        relationship: [RelationField | undefined, Node[]],
        edge?: Relationship
    ) {
        super();
        this.node = node;
        this.parent = parent;
        this.nodeProperties = nodeProperties;
        this.edgeProperties = edgeProperties;
        this.relationshipPropertyPath = relationshipPropertyPath;
        this.relationship = relationship;
        this.edge = edge;
    }

    accept<R>(visitor: Visitor<R>): R {
        return visitor.visitNestedCreate(this);
    }
}