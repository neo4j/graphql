export type GraphQLTree = GraphQLTreeReadOperation;

interface GraphQLTreeElement {
    alias: string;
    args: Record<string, any>;
}

export interface GraphQLTreeReadOperation extends GraphQLTreeElement {
    fields: {
        connection?: GraphQLTreeConnection;
    };
}

export interface GraphQLTreeConnection extends GraphQLTreeElement {
    fields: {
        edges?: GraphQLTreeEdge;
    };
}

export interface GraphQLTreeEdge extends GraphQLTreeElement {
    fields: {
        node?: GraphQLTreeNode;
        properties?: GraphQLTreeEdgeProperties;
    };
}

export interface GraphQLTreeNode extends GraphQLTreeElement {
    fields: Record<string, GraphQLTreeLeafField | GraphQLTreeReadOperation>;
}

export interface GraphQLTreeEdgeProperties extends GraphQLTreeElement {
    fields: Record<string, GraphQLTreeLeafField>;
}

export interface GraphQLTreeLeafField extends GraphQLTreeElement {
    fields: undefined;
}
