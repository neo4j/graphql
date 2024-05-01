export type GraphQLTree = GraphQLTreeReadOperation;

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
        properties?: GraphQLTreeProperties;
    };
}

export interface GraphQLTreeNode extends GraphQLTreeElement {
    fields: Record<string, GraphQLTreeLeafField | GraphQLTreeReadOperation>;
}

export interface GraphQLTreeProperties extends GraphQLTreeElement {
    fields: Record<string, GraphQLTreeLeafField>;
}

interface GraphQLTreeElement {
    alias: string;
    args: Record<string, any>;
}

export interface GraphQLTreeLeafField extends GraphQLTreeElement {}
