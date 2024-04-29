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
import type { ResolveTreeReadOperation } from "./ResolveTreeParser";
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

        const nodeFieldsTree = connectionTree.fields.edges?.fields.node?.fields ?? {};
        const nodeFields = this.getNodeFields(entity, nodeFieldsTree);
        return new ConnectionReadOperation({
            target,
            selection,
            fields: {
                edge: [],
                node: nodeFields,
            },
        });
    }

    private getNodeFields(entity: ConcreteEntity, nodeFieldsTree: Record<string, any>) {
        return Object.entries(nodeFieldsTree).map(([name, rawField]) => {
            const attribute = entity.attributes.get(name);
            if (!attribute) {
                throw new Error(`Attribute ${name} not found in ${entity.name}`);
            }

            return new AttributeField({
                alias: rawField.alias,
                attribute: new AttributeAdapter(attribute),
            });
        });
    }
}
