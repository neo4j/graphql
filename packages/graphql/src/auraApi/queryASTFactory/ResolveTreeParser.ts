import type { ResolveTree } from "graphql-parse-resolve-info";
import type { ConcreteEntity } from "../../schema-model/entity/ConcreteEntity";
import { AuraEntityOperations } from "../AuraEntityOperations";

type ResolveTreeElement<T extends Record<string, ResolveTreeEntityField | ResolveTreeElement<any>>> = {
    alias: string;
    args: Record<string, any>;
    fields: T;
};

export type ResolveTreeEntityField = {
    alias: string;
    args: Record<string, any>;
};
type ResolveTreeNode = ResolveTreeElement<Record<string, ResolveTreeEntityField>>;
type ResolveTreeEdge = ResolveTreeElement<{ node?: ResolveTreeNode }>;
type ResolveTreeConnection = ResolveTreeElement<{ edges?: ResolveTreeEdge }>;

export type AuraAPIResolveTree = ResolveTreeElement<{ connection?: ResolveTreeConnection }>;

export class ResolveTreeParser {
    private operations: AuraEntityOperations;

    constructor(entity: ConcreteEntity) {
        this.operations = new AuraEntityOperations(entity);
    }

    public parse(resolveTree: ResolveTree): AuraAPIResolveTree {
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
        const fields = Object.entries(fieldsResolveTree).reduce(
            (acc, [key, f]): Record<string, ResolveTreeEntityField> => {
                acc[key] = {
                    alias: f.alias,
                    args: f.args,
                };
                return acc;
            },
            {}
        );

        return {
            alias: nodeResolveTree.alias,
            args: nodeResolveTree.args,
            fields: fields,
        };
    }
}
