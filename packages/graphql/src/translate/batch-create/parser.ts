import type { Context, RelationField } from "../../types";
import type { CreateInput, TreeDescriptor } from "./types";
import { UnsupportedUnwindOptimisation } from "./types";
import { GraphElement, Neo4jGraphQLError, Node, Relationship } from "../../classes";
import * as CypherBuilder from "../cypher-builder/CypherBuilder";
import { getRelationshipFields } from "./utils";
import { AST, CreateAST, NestedCreateAST } from "./GraphQLInputAST/GraphQLInputAST";
import mapToDbProperty from "../../utils/map-to-db-property";

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

function isScalar(fieldName: string, node: Node, relationship?: Relationship) {
    const predicate = (x) => x.fieldName === fieldName;
    const scalarFields = [node.primitiveFields, node.temporalFields, node.pointFields, node.scalarFields];
    if (relationship) {
        scalarFields.push(
            ...[
                relationship.primitiveFields,
                relationship.temporalFields,
                relationship.pointFields,
                relationship.scalarFields,
            ]
        );
    }
    return scalarFields.flat().some(predicate);
}

export function getTreeDescriptor(
    input: CreateInput,
    node: Node,
    context: Context,
    relationship?: Relationship
): TreeDescriptor {
    return Object.entries(input).reduce(
        (previous, [key, value]) => {
            const [relationField, relatedNodes] = getRelationshipFields(node, key, value, context);
            if (relationField && relationField.properties) {
                relationship = context.relationships.find(
                    (x) => x.properties === relationField.properties
                ) as unknown as Relationship;
            }
            /* 
                TODO: Using this approach to distinguish between "Children" and "Properties"
                could lead to bugs in case ofwith properties with same name as the Operation name.
                For isntance: { create: {node: { create: true } } }
            */
            if (typeof value === "object" && value !== null && !isScalar(key, node, relationship)) {
                // TODO: supports union/interfaces
                const innerNode = relationField ? relatedNodes[0] : node;
                if (Array.isArray(value)) {
                    previous.childrens[key] = mergeTreeDescriptors(
                        value.map((el) => getTreeDescriptor(el as CreateInput, innerNode, context, relationship))
                    );
                    return previous;
                }
                previous.childrens[key] = getTreeDescriptor(value as CreateInput, innerNode, context, relationship);
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
            );
            previous.childrens = Object.fromEntries(entries);
            return previous;
        },
        { properties: new Set(), childrens: {} } as TreeDescriptor
    );
}

function parser(input: TreeDescriptor, node: Node, context: Context, parentASTNode: AST): AST {
    if (node.auth) {
        throw new UnsupportedUnwindOptimisation("Not supported operation: Auth");
    }
    Object.entries(input.childrens).forEach(([key, value]) => {
        const [relationField, relatedNodes] = getRelationshipFields(node, key, {}, context);

        if (relationField) {
            let edge;
            if (relationField.properties) {
                edge = context.relationships.find(
                    (x) => x.properties === relationField.properties
                ) as unknown as Relationship;
            }
            if (relationField.interface || relationField.union) {
                throw new UnsupportedUnwindOptimisation(`Not supported operation: Interface or Union`);
            }
            Object.entries(value.childrens).forEach(([operation, description]) => {
                switch (operation) {
                    case "create":
                        parentASTNode.addChildren(
                            parseNestedCreate(
                                description,
                                relatedNodes[0],
                                context,
                                node,
                                key,
                                [relationField, relatedNodes],
                                edge
                            )
                        );
                        break;
                    /*
                    case "connect":
                         parentASTNode.addChildren(
                            parseConnect(description, relatedNodes[0], context, node, key, [
                                relationField,
                                relatedNodes,
                            ])
                        ); 
                        break;
                    case "connectOrCreate":
                         parentASTNode.addChildren(parseConnectOrCreate(description, relatedNodes[0], context, node)); 
                        break;
                    */
                    default:
                        throw new UnsupportedUnwindOptimisation(`Not supported operation: ${operation}`);
                }
            });
        }
    });
    return parentASTNode;
}

function raiseAttributeAmbiguity(properties: Set<string> | Array<string>, graphElement: GraphElement) {
    const hash = {};
    properties.forEach((property) => {
        const dbName = mapToDbProperty(graphElement, property);
        if (hash[dbName]) {            
            throw new Neo4jGraphQLError(`Conflicting modification of ${[hash[dbName], property].map((n) => `[[${n}]]`).join(", ")} on type ${graphElement.name}`);
        }
        hash[dbName] = property;
    });
}

function raiseOnNotSupportedProperty(graphElement: GraphElement) {
    graphElement.primitiveFields.forEach((property) => {
        if (property.callback && property.callback.operations.includes("CREATE")) {
            throw new UnsupportedUnwindOptimisation("Not supported operation: Callback");
        }
        if (property.auth) {
            throw new UnsupportedUnwindOptimisation("Not supported operation: Auth");
        }
    });
}

export function parseCreate(input: TreeDescriptor, node: Node, context: Context) {
    const nodeProperties = input.properties;
    raiseOnNotSupportedProperty(node);
    raiseAttributeAmbiguity(input.properties, node);
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
    relationship: [RelationField | undefined, Node[]],
    edge?: Relationship
) {
    const nodeProperties = input.childrens.node.properties;
    const edgeProperties = input.childrens.edge ? input.childrens.edge.properties : [];
    raiseOnNotSupportedProperty(node);
    raiseAttributeAmbiguity(nodeProperties, node);
    if (edge) {
        raiseOnNotSupportedProperty(edge);
        raiseAttributeAmbiguity(edgeProperties, edge);
    }

    const nestedCreateAST = new NestedCreateAST(
        node,
        parentNode,
        [...nodeProperties],
        [...edgeProperties],
        relationshipPropertyPath,
        relationship,
        edge
    );
    if (input.childrens.node) {
        parser(input.childrens.node, node, context, nestedCreateAST);
    }
    return nestedCreateAST;
}

/* export function parseConnect(
    input: TreeDescriptor,
    node: Node,
    context: Context,
    parentNode: Node,
    relationshipPropertyPath: string,
    relationship: [RelationField | undefined, Node[]]
) {
    const edgeProperties = input.childrens.edge ? input.childrens.edge.properties : [];
    const where = input.childrens.where;
    const connect = input.childrens.connect;
    const connectAST = new ConnectAST(
        node,
        parentNode,
        [...edgeProperties],
        where,
        connect,
        relationshipPropertyPath,
        relationship
    );
    // TODO: remove it
    console.info(context);
    return connectAST;
} */
/* 
export function parseConnectOrCreate(input: TreeDescriptor, node: Node, context: Context, parentNode: Node) {
    const where = input.childrens.where;
    const onCreate = input.childrens.onCreate;
    const connectOrCreateAST = new ConnectOrCreateAST(parentNode, where, onCreate);

    // TODO: remove it
    console.info(node);
    console.info(context);

    return connectOrCreateAST;
}
 */