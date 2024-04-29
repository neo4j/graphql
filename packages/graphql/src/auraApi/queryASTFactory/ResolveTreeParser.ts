import type { ResolveTree } from "graphql-parse-resolve-info";
import type { ConcreteEntity } from "../../schema-model/entity/ConcreteEntity";
import { AuraEntityOperations } from "../AuraEntityOperations";

type ResolveTreeArgs = Record<string, any>;

interface ResolveTreeElement {
    alias: string;
    args: ResolveTreeArgs;
}

export interface ResolveTreeReadOperation extends ResolveTreeElement {
    fields: {
        connection?: ResolveTreeConnection;
    };
}

export interface ResolveTreeConnection extends ResolveTreeElement {
    fields: {
        edges?: ResolveTreeEdge;
    };
}
export interface ResolveTreeEdge extends ResolveTreeElement {
    fields: {
        node?: ResolveTreeNode;
    };
}
export interface ResolveTreeNode extends ResolveTreeElement {
    fields: Record<string, ResolveTreeElement>;
}

export class ResolveTreeParser {
    private operations: AuraEntityOperations;

    constructor(entity: ConcreteEntity) {
        this.operations = new AuraEntityOperations(entity);
    }

    public parse(resolveTree: ResolveTree): ResolveTreeReadOperation {
        const fieldsByTypeName = resolveTree.fieldsByTypeName[this.operations.connectionOperation] ?? {};

        const connectionResolveTree = fieldsByTypeName["connection"];
        const connection = connectionResolveTree ? this.parseConnection(connectionResolveTree) : undefined;

        return {
            alias: resolveTree.alias,
            args: resolveTree.args,
            fields: {
                connection,
            },
        };
    }

    private parseConnection(connectionResolveTree: ResolveTree): ResolveTreeConnection {
        const edgesResolveTree = connectionResolveTree.fieldsByTypeName[this.operations.connectionType]?.["edges"];
        const edgeResolveTree = edgesResolveTree ? this.parseEdges(edgesResolveTree) : undefined;
        return {
            alias: connectionResolveTree.alias,
            args: connectionResolveTree.args,
            fields: {
                edges: edgeResolveTree,
            },
        };
    }

    private parseEdges(connectionResolveTree: ResolveTree): ResolveTreeEdge {
        const nodeResolveTree = connectionResolveTree.fieldsByTypeName[this.operations.edgeType]?.["node"];

        const node = nodeResolveTree ? this.parseEntity(nodeResolveTree) : undefined;

        return {
            alias: connectionResolveTree.alias,
            args: connectionResolveTree.args,
            fields: {
                node: node,
            },
        };
    }

    private parseEntity(nodeResolveTree: ResolveTree): ResolveTreeEdge {
        const fieldsResolveTree = nodeResolveTree.fieldsByTypeName[this.operations.nodeType] ?? {};
        const fields = Object.entries(fieldsResolveTree).reduce((acc, [key, f]): Record<string, any> => {
            acc[key] = {
                alias: f.alias,
                args: f.args,
            };
            return acc;
        }, {});

        return {
            alias: nodeResolveTree.alias,
            args: nodeResolveTree.args,
            fields: fields,
        };
    }
}
