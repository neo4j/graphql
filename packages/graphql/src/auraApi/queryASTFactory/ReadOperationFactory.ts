import type { ResolveTree } from "graphql-parse-resolve-info";
import type { Neo4jGraphQLSchemaModel } from "../../schema-model/Neo4jGraphQLSchemaModel";
import { AttributeAdapter } from "../../schema-model/attribute/model-adapters/AttributeAdapter";
import type { ConcreteEntity } from "../../schema-model/entity/ConcreteEntity";
import { ConcreteEntityAdapter } from "../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import { QueryAST } from "../../translate/queryAST/ast/QueryAST";
import { AttributeField } from "../../translate/queryAST/ast/fields/attribute-fields/AttributeField";
import { ConnectionReadOperation } from "../../translate/queryAST/ast/operations/ConnectionReadOperation";
import type { Operation } from "../../translate/queryAST/ast/operations/operations";
import { NodeSelection } from "../../translate/queryAST/ast/selection/NodeSelection";
import { AuraEntityOperations } from "../AuraEntityOperations";

/** Nested Records helper type, supports any level of recursion. Ending in properties of type T */
// export interface NestedRecord<T> extends Record<string | symbol | number, T | NestedRecord<T>> {} // Using interface to allow recursive types

type ResolveTreeElement<T extends Record<string, ResolveTreeEntityField | ResolveTreeElement<any>>> = {
    alias: string;
    args: Record<string, any>;
    fields: T;
};

type ResolveTreeEntityField = {
    alias: string;
    args: Record<string, any>;
};
type ResolveTreeNode = ResolveTreeElement<Record<string, ResolveTreeEntityField>>;
type ResolveTreeEdge = ResolveTreeElement<{ node?: ResolveTreeNode }>;
type ResolveTreeConnection = ResolveTreeElement<{ edges?: ResolveTreeEdge }>;

type AuraAPIResolveTree = ResolveTreeElement<{ connection?: ResolveTreeConnection }>;

class ResolveTreeParser {
    public parse(concreteEntity: ConcreteEntity, resolveTree: ResolveTree): AuraAPIResolveTree {
        const auraOps = new AuraEntityOperations(concreteEntity);
        const fieldsByTypeName = resolveTree.fieldsByTypeName[auraOps.connectionOperation] ?? {};

        const connectionResolveTree = fieldsByTypeName["connection"];
        const connection = connectionResolveTree
            ? this.parseConnection(concreteEntity, auraOps, connectionResolveTree)
            : undefined;

        return {
            alias: resolveTree.alias,
            args: resolveTree.args,
            fields: {
                connection,
            },
        };
    }

    private parseConnection(
        concreteEntity: ConcreteEntity,
        auraOps: AuraEntityOperations,
        connectionResolveTree: ResolveTree
    ): ResolveTreeConnection {
        const edgesResolveTree = connectionResolveTree.fieldsByTypeName[auraOps.connectionType]?.["edges"];
        const edgeResolveTree = edgesResolveTree
            ? this.parseEdges(concreteEntity, auraOps, edgesResolveTree)
            : undefined;
        return {
            alias: connectionResolveTree.alias,
            args: connectionResolveTree.args,
            fields: {
                edges: edgeResolveTree,
            },
        };
    }

    private parseEdges(
        concreteEntity: ConcreteEntity,
        auraOps: AuraEntityOperations,
        connectionResolveTree: ResolveTree
    ): ResolveTreeEdge {
        const nodeResolveTree = connectionResolveTree.fieldsByTypeName[auraOps.edgeType]?.["node"];

        const node = nodeResolveTree ? this.parseEntity(concreteEntity, auraOps, nodeResolveTree) : undefined;

        return {
            alias: connectionResolveTree.alias,
            args: connectionResolveTree.args,
            fields: {
                node: node,
            },
        };
    }

    private parseEntity(
        concreteEntity: ConcreteEntity,
        auraOps: AuraEntityOperations,
        nodeResolveTree: ResolveTree
    ): ResolveTreeEdge {
        const fieldsResolveTree = nodeResolveTree.fieldsByTypeName[auraOps.nodeType] ?? {};
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

export class ReadOperationFactory {
    public schemaModel: Neo4jGraphQLSchemaModel;

    constructor(schemaModel: Neo4jGraphQLSchemaModel) {
        this.schemaModel = schemaModel;
    }

    public createAST({
        resolveTree,
        entity,
        context,
    }: {
        resolveTree: ResolveTree;
        entity: ConcreteEntity;
        context;
    }): QueryAST {
        const resolveTreeParser = new ResolveTreeParser();

        const parsedTree = resolveTreeParser.parse(entity, resolveTree);
        const operation = this.generateOperation({
            parsedTree: parsedTree,
            entity,
            context,
        });
        return new QueryAST(operation);
    }

    private generateOperation({
        parsedTree,
        entity,
        context,
    }: {
        parsedTree: AuraAPIResolveTree;
        entity: ConcreteEntity;
        context;
    }): Operation {
        const connectionTree = parsedTree.fields.connection;
        if (!connectionTree) {
            throw new Error("No Connection");
        }
        const target = new ConcreteEntityAdapter(entity);
        const selection = new NodeSelection({
            target,
        });

        const nodeFieldsTree = connectionTree.fields.edges?.fields.node?.fields ?? {};

        const nodeFields = Object.entries(nodeFieldsTree).map(([name, rawField]) => {
            const attribute = entity.attributes.get(name);
            if (!attribute) {
                throw new Error(`Attribute ${name} not found in ${entity.name}`);
            }

            return new AttributeField({
                alias: rawField.alias,
                attribute: new AttributeAdapter(attribute),
            });
        });

        return new ConnectionReadOperation({
            target,
            selection,
            fields: {
                edge: [],
                node: nodeFields,
            },
        });
    }
}
