import type { TreeDescriptor } from "../types";
import type { RelationField } from "../../../types";
import type { Node, Relationship } from "../../../classes";

export interface IAST {
    childrens: IAST[];
    addChildren: (children: IAST) => void;
    accept: <R>(visitor: Visitor<R>) => R;
}

export interface IConnectAST extends IAST{
    node: Node;
    parent: Node;
    edgeProperties: string[];
    where: TreeDescriptor;
    connect: TreeDescriptor;
    relationshipPropertyPath: string;
    relationship: [RelationField | undefined, Node[]];
}

export interface IConnectOrCreateAST extends IAST {
    parent: Node;
    where: TreeDescriptor;
    onCreate: TreeDescriptor;
}

export interface ICreateAST extends IAST {
    nodeProperties: string[];
    node: Node;
}

export interface INestedCreateAST extends IAST {
    node: Node;
    parent: Node;
    nodeProperties: string[];
    edgeProperties: string[];
    relationshipPropertyPath: string;
    relationship: [RelationField | undefined, Node[]];
    edge: Relationship | undefined
}

export interface Visitor<R> {
    visitNode: (ast: IAST) => R;
    visitCreate: (create: ICreateAST) => R;
    visitNestedCreate: (nestedCreate: INestedCreateAST) => R;
    visitConnect: (connect: IConnectAST) => R;
    visitConnectOrCreate: (connectOrCreate: IConnectOrCreateAST) => R;
}
