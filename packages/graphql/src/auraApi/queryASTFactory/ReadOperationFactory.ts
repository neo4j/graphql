import type { ResolveTree } from "graphql-parse-resolve-info";
import type { Neo4jGraphQLSchemaModel } from "../../schema-model/Neo4jGraphQLSchemaModel";
import { AttributeAdapter } from "../../schema-model/attribute/model-adapters/AttributeAdapter";
import type { ConcreteEntity } from "../../schema-model/entity/ConcreteEntity";
import { ConcreteEntityAdapter } from "../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { Relationship } from "../../schema-model/relationship/Relationship";
import { RelationshipAdapter } from "../../schema-model/relationship/model-adapters/RelationshipAdapter";
import { QueryAST } from "../../translate/queryAST/ast/QueryAST";
import { AuraReadOperation } from "../../translate/queryAST/ast/aura-api/ConnectionReadOperation";
import type { Field } from "../../translate/queryAST/ast/fields/Field";
import { OperationField } from "../../translate/queryAST/ast/fields/OperationField";
import { AttributeField } from "../../translate/queryAST/ast/fields/attribute-fields/AttributeField";
import { NodeSelection } from "../../translate/queryAST/ast/selection/NodeSelection";
import { RelationshipSelection } from "../../translate/queryAST/ast/selection/RelationshipSelection";
import { filterTruthy } from "../../utils/utils";
import { ResolveTreeParser } from "./resolve-tree-parser/ResolveTreeParser";
import type {
    GraphQLTree,
    GraphQLTreeNode,
    GraphQLTreeProperties,
    GraphQLTreeReadOperation,
} from "./resolve-tree-parser/graphql-tree";

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
        parsedTree: GraphQLTree;
        entity: ConcreteEntity;
    }): AuraReadOperation {
        const connectionTree = parsedTree.fields.connection;
        if (!connectionTree) {
            throw new Error("No Connection");
        }

        const target = new ConcreteEntityAdapter(entity);
        const selection = new NodeSelection({
            target,
        });

        const nodeResolveTree = connectionTree.fields.edges?.fields.node;
        const nodeFields = this.getNodeFields(entity, nodeResolveTree);
        return new AuraReadOperation({
            target,
            selection,
            fields: {
                edge: [],
                node: nodeFields,
            },
        });
    }

    private generateRelationshipOperation({
        parsedTree,
        relationship,
    }: {
        parsedTree: GraphQLTreeReadOperation;
        relationship: Relationship;
    }): AuraReadOperation {
        const connectionTree = parsedTree.fields.connection;
        if (!connectionTree) {
            throw new Error("No Connection");
        }

        const relationshipAdapter = new RelationshipAdapter(relationship);
        if (!(relationshipAdapter.target instanceof ConcreteEntityAdapter)) {
            throw new QueryParseError("Interfaces not supported");
        }

        // Selection
        const selection = new RelationshipSelection({
            relationship: relationshipAdapter,
            alias: parsedTree.alias,
        });

        // Fields
        const nodeResolveTree = connectionTree.fields.edges?.fields.node;
        const propertiesResolveTree = connectionTree.fields.edges?.fields.properties;
        const nodeFields = this.getNodeFields(relationshipAdapter.target.entity, nodeResolveTree);
        const edgeFields = this.getAttributeFields(relationship, propertiesResolveTree);

        return new AuraReadOperation({
            target: relationshipAdapter.target,
            selection,
            fields: {
                edge: edgeFields,
                node: nodeFields,
            },
        });
    }

    private getAttributeFields(target: ConcreteEntity, propertiesTree: GraphQLTreeNode | undefined): Field[];
    private getAttributeFields(target: Relationship, propertiesTree: GraphQLTreeProperties | undefined): Field[];
    private getAttributeFields(
        target: Relationship | ConcreteEntity,
        propertiesTree: GraphQLTreeProperties | GraphQLTreeNode | undefined
    ): Field[] {
        if (!propertiesTree) {
            return [];
        }

        return filterTruthy(
            Object.entries(propertiesTree.fields).map(([name, rawField]) => {
                const attribute = target.findAttribute(name);
                if (attribute) {
                    return new AttributeField({
                        alias: rawField.alias,
                        attribute: new AttributeAdapter(attribute),
                    });
                }
                return undefined;
            })
        );
    }

    private getRelationshipFields(entity: ConcreteEntity, nodeResolveTree: GraphQLTreeNode | undefined): Field[] {
        if (!nodeResolveTree) {
            return [];
        }

        return filterTruthy(
            Object.entries(nodeResolveTree.fields).map(([name, rawField]) => {
                const relationship = entity.findRelationship(name);
                if (relationship) {
                    // FIX casting here
                    return this.generateRelationshipField(rawField as GraphQLTreeReadOperation, relationship);
                }
            })
        );
    }

    private getNodeFields(entity: ConcreteEntity, nodeResolveTree: GraphQLTreeNode | undefined): Field[] {
        const attributeFields = this.getAttributeFields(entity, nodeResolveTree);
        const relationshipFields = this.getRelationshipFields(entity, nodeResolveTree);
        return [...attributeFields, ...relationshipFields];
    }

    private generateRelationshipField(
        resolveTree: GraphQLTreeReadOperation,
        relationship: Relationship
    ): OperationField {
        const relationshipOperation = this.generateRelationshipOperation({
            relationship: relationship,
            parsedTree: resolveTree,
        });

        return new OperationField({
            alias: resolveTree.alias,
            operation: relationshipOperation,
        });
    }
}

export class QueryParseError extends Error {}
