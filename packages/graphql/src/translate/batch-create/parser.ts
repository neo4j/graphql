import type { Context, RelationField } from "../../types";
import type { CreateInput, TreeDescriptor } from "./types";
import type { Node } from "../../classes";
import * as CypherBuilder from "../cypher-builder/CypherBuilder";
import { getRelationshipFields } from "./utils";
import { AST, CreateAST, NestedCreateAST, ConnectAST, ConnectOrCreateAST } from "./GraphQLInputAST/GraphQLInputAST";

// TODO: refactor this tree traversal
export function inputTreeToCypherMap(
    input: CreateInput[] | CreateInput,
    node: Node,
    context: Context
): CypherBuilder.List | CypherBuilder.Map {
    if (Array.isArray(input)) {
        return new CypherBuilder.List(
            input.map((createInput: CreateInput) => inputTreeToCypherMap(createInput, node, context))
        );
    }

    const properties = (Object.entries(input) as CreateInput).reduce(
        (obj: Record<string, CypherBuilder.Expr>, [key, value]: [string, Record<string, any>]) => {
            const [relationField, relatedNodes] = getRelationshipFields(node, key, {}, context);
            const RESERVED_NAMES = ["node", "edge", "create", "connect", "connectOrCreate"];
            // TODO: supports union/interfaces
            if (typeof value === "object" && value !== null && (relationField || RESERVED_NAMES.includes(key))) {
                if (Array.isArray(value)) {
                    obj[key] = new CypherBuilder.List(
                        value.map((createInput: CreateInput) =>
                            inputTreeToCypherMap(createInput, relationField ? relatedNodes[0] : node, context)
                        )
                    );
                    return obj;
                }
                obj[key] = inputTreeToCypherMap(
                    value as CreateInput[] | CreateInput,
                    relationField ? relatedNodes[0] : node,
                    context
                ) as CypherBuilder.Map;
                return obj;
            }
            obj[key] = new CypherBuilder.Param(value);
            return obj;
        },
        {} as Record<string, CypherBuilder.Expr>
    ) as Record<string, CypherBuilder.Expr>;
    return new CypherBuilder.Map(properties);
}

export function getTreeDescriptor(input: CreateInput, node: Node, context: Context): TreeDescriptor {
    return Object.entries(input).reduce(
        (previous, [key, value]) => {
            const [relationField, relatedNodes] = getRelationshipFields(node, key as string, {}, context);
            const primitiveField = node.primitiveFields.find((x) => key === x.fieldName);
            const temporalFields = node.temporalFields.find((x) => key === x.fieldName);
            const pointField = node.pointFields.find((x) => key === x.fieldName);
            // TODO: supports union/interfaces
            if (typeof value === "object" && value !== null && !primitiveField && !temporalFields && !pointField) {
                const innerNode = relationField ? relatedNodes[0] : node;
                if (Array.isArray(value)) {
                    previous.childrens[key] = mergeTreeDescriptors(
                        value.map((el) => getTreeDescriptor(el as CreateInput, innerNode, context))
                    );
                    return previous;
                }
                previous.childrens[key] = getTreeDescriptor(value as CreateInput, innerNode, context);
                return previous;
            }
            previous.properties.add(key);
            return previous;
        },
        { properties: new Set(), childrens: {} } as TreeDescriptor
    );
}

export function mergeTreeDescriptors(input: TreeDescriptor[]): TreeDescriptor {
    return input.reduce(
        (previous: TreeDescriptor, node: TreeDescriptor) => {
            previous.properties = new Set([...previous.properties, ...node.properties]);
            const entries = [...new Set([...Object.keys(previous.childrens), ...Object.keys(node.childrens)])].map(
                (childrenKey) => {
                    const previousChildren: TreeDescriptor =
                        previous.childrens[childrenKey] ?? ({ properties: new Set(), childrens: {} } as TreeDescriptor);
                    const nodeChildren: TreeDescriptor =
                        node.childrens[childrenKey] ?? ({ properties: new Set(), childrens: {} } as TreeDescriptor);
                    return [childrenKey, mergeTreeDescriptors([previousChildren, nodeChildren])];
                }
            ) as [string, TreeDescriptor][];
            previous.childrens = Object.fromEntries(entries);
            return previous;
        },
        { properties: new Set(), childrens: {} } as TreeDescriptor
    );
}

function parser(input: TreeDescriptor, node: Node, context: Context, parentASTNode: AST): AST {
    Object.entries(input.childrens).forEach(([key, value]) => {
        const [relationField, relatedNodes] = getRelationshipFields(node, key, {}, context);
        if (relationField) {
            Object.entries(value.childrens).forEach(([operation, description]) => {
                switch (operation) {
                    case "create":
                        parentASTNode.addChildren(
                            parseNestedCreate(description, relatedNodes[0], context, node, key, [
                                relationField,
                                relatedNodes,
                            ])
                        );
                        break;
                    case "connect":
                        parentASTNode.addChildren(parseConnect(description, relatedNodes[0], context, node));
                        break;
                    case "connectOrCreate":
                        parentASTNode.addChildren(parseConnectOrCreate(description, relatedNodes[0], context, node));
                        break;
                    default:
                        // throw?
                        break;
                }
            });
        }
    });
    return parentASTNode;
}

export function parseCreate(input: TreeDescriptor, node: Node, context: Context) {
    const nodeProperties = input.properties;
    const createAST = new CreateAST([...nodeProperties], node);
    parser(input, node, context, createAST);
    return createAST;
}

function parseNestedCreate(
    input: TreeDescriptor,
    node: Node,
    context: Context,
    parentNode: Node,
    relationshipPropertyPath: string,
    relationship: [RelationField | undefined, Node[]]
) {
    const nodeProperties = input.childrens.node.properties;
    const edgeProperties = input.childrens.edge ? input.childrens.edge.properties : [];
    const nestedCreateAST = new NestedCreateAST(
        node,
        parentNode,
        [...nodeProperties],
        [...edgeProperties],
        relationshipPropertyPath,
        relationship
    );
    if (input.childrens.node) {
        parser(input.childrens.node, node, context, nestedCreateAST);
    }
    return nestedCreateAST;
}
/* 
input ActorMoviesConnectFieldInput {
    where: MovieConnectWhere
    connect: [MovieConnectInput!]
    edge: ActedInCreateInput
} */
function parseConnect(input: TreeDescriptor, node: Node, context: Context, parentNode: Node) {
    const edgeProperties = input.childrens.edge ? input.childrens.edge.properties : [];
    const where = input.childrens.where;
    const connect = input.childrens.connect;
    const connectAST = new ConnectAST(parentNode, [...edgeProperties], where, connect);
    // parser(input.childrens.node, node, context, connectAST);
    return connectAST;
}

/* 
input ActorMoviesConnectOrCreateFieldInput {
    where: MovieConnectOrCreateWhere!
    onCreate: ActorMoviesConnectOrCreateFieldInputOnCreate!
}
*/
function parseConnectOrCreate(input: TreeDescriptor, node: Node, context: Context, parentNode: Node) {
    const where = input.childrens.where;
    const onCreate = input.childrens.onCreate;
    const connectOrCreateAST = new ConnectOrCreateAST(parentNode, where, onCreate);
    // parser(input.childrens.node, node, context, connectOrCreateAST);
    return connectOrCreateAST;
}
