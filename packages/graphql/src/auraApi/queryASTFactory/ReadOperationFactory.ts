import type { ResolveTree } from "graphql-parse-resolve-info";
import type { Neo4jGraphQLSchemaModel } from "../../schema-model/Neo4jGraphQLSchemaModel";
import { AttributeAdapter } from "../../schema-model/attribute/model-adapters/AttributeAdapter";
import { ConcreteEntity } from "../../schema-model/entity/ConcreteEntity";
import { ConcreteEntityAdapter } from "../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import { QueryAST } from "../../translate/queryAST/ast/QueryAST";
import type { Field } from "../../translate/queryAST/ast/fields/Field";
import { OperationField } from "../../translate/queryAST/ast/fields/OperationField";
import { AttributeField } from "../../translate/queryAST/ast/fields/attribute-fields/AttributeField";
import { ConnectionReadOperation } from "../../translate/queryAST/ast/operations/ConnectionReadOperation";
import type { Operation } from "../../translate/queryAST/ast/operations/operations";
import { NodeSelection } from "../../translate/queryAST/ast/selection/NodeSelection";
import type { ResolveTreeNode, ResolveTreeReadOperation } from "./ResolveTreeParser";
import { ResolveTreeParser } from "./ResolveTreeParser";

export class ReadOperationFactory {
    public schemaModel: Neo4jGraphQLSchemaModel;

    constructor(schemaModel: Neo4jGraphQLSchemaModel) {
        this.schemaModel = schemaModel;
    }

    public createAST({ resolveTree, entity }: { resolveTree: ResolveTree; entity: ConcreteEntity }): QueryAST {
        const resolveTreeParser = new ResolveTreeParser(entity);

        const parsedTree = resolveTreeParser.parse(resolveTree);
        const operation = this.generateOperation({
            parsedTree: parsedTree,
            entity,
        });
        return new QueryAST(operation);
    }

    private generateOperation({
        parsedTree,
        entity,
    }: {
        parsedTree: ResolveTreeReadOperation;
        entity: ConcreteEntity;
    }): Operation {
        const connectionTree = parsedTree.fields.connection;
        if (!connectionTree) {
            throw new Error("No Connection");
        }
        const target = new ConcreteEntityAdapter(entity);
        const selection = new NodeSelection({
            target,
        });

        // const nodeFieldsTree = connectionTree.fields.edges?.fields.node?.fields ?? {};

        const nodeResolveTree = connectionTree.fields.edges?.fields.node;
        const nodeFields = this.getNodeFields(entity, nodeResolveTree);
        return new ConnectionReadOperation({
            target,
            selection,
            fields: {
                edge: [],
                node: nodeFields,
            },
        });
    }

    private getNodeFields(entity: ConcreteEntity, nodeResolveTree: ResolveTreeNode | undefined): Field[] {
        if (!nodeResolveTree) {
            return [];
        }

        return Object.entries(nodeResolveTree.fields).map(([name, rawField]) => {
            const attribute = entity.findAttribute(name);
            if (attribute) {
                return new AttributeField({
                    alias: rawField.alias,
                    attribute: new AttributeAdapter(attribute),
                });
            }

            const relationship = entity.findRelationship(name);
            if (relationship) {
                if (!(relationship.target instanceof ConcreteEntity)) {
                    throw new QueryParseError("Interfaces not supported");
                }
                const relationshipOperation = this.generateOperation({
                    entity: relationship.target,
                    parsedTree: rawField as ResolveTreeReadOperation, // Fix this!
                });

                return new OperationField({
                    alias: rawField.alias,
                    operation: relationshipOperation,
                });
            }

            throw new QueryParseError(`field ${name} not found in ${entity.name}`);
        });
    }
}

export class QueryParseError extends Error {}
