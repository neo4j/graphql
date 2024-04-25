import type { ResolveTree } from "graphql-parse-resolve-info";
import type { Neo4jGraphQLSchemaModel } from "../../schema-model/Neo4jGraphQLSchemaModel";
import { AttributeAdapter } from "../../schema-model/attribute/model-adapters/AttributeAdapter";
import type { ConcreteEntity } from "../../schema-model/entity/ConcreteEntity";
import { ConcreteEntityAdapter } from "../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import { QueryAST } from "../../translate/queryAST/ast/QueryAST";
import type { Field } from "../../translate/queryAST/ast/fields/Field";
import { AttributeField } from "../../translate/queryAST/ast/fields/attribute-fields/AttributeField";
import { ConnectionReadOperation } from "../../translate/queryAST/ast/operations/ConnectionReadOperation";
import type { Operation } from "../../translate/queryAST/ast/operations/operations";
import type { EntitySelection } from "../../translate/queryAST/ast/selection/EntitySelection";
import { NodeSelection } from "../../translate/queryAST/ast/selection/NodeSelection";
import { AuraEntityOperations } from "../AuraEntityOperations";

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
        const operation = this.parseResolveTree({ resolveTree, entity, context });
        return new QueryAST(operation);
    }

    private parseResolveTree({
        resolveTree,
        entity,
        context,
    }: {
        resolveTree: ResolveTree;
        entity: ConcreteEntity;
        context;
    }): Operation {
        const entityOperations = new AuraEntityOperations(entity);
        const operationEntry = resolveTree.fieldsByTypeName[entityOperations.connectionOperation];
        if (!operationEntry) {
            throw new Error(`Transpile Error: OperationType ${entityOperations.connectionOperation} not found`);
        }

        const connectionField = operationEntry["connection"];
        if (connectionField) {
            const resolveConnectionField = connectionField.fieldsByTypeName[entityOperations.connectionType];
            if (resolveConnectionField) {
                return this.parseConnectionOperation({
                    connectionEntry: resolveConnectionField,
                    entity,
                    entityOperations,
                    context,
                });
            }
        }

        throw new Error("missing Operation");
    }

    private parseConnectionOperation({
        connectionEntry,
        entity,
        entityOperations,
        context,
    }: {
        connectionEntry: {
            [str: string]: ResolveTree;
        };
        entity: ConcreteEntity;
        entityOperations: AuraEntityOperations;
        context;
    }): Operation {
        const selection = this.parseConnectionSelection({ entity });

        const fields = this.parseConnectionFields({
            fields: connectionEntry.edges?.fieldsByTypeName[entityOperations.edgeType] ?? {},
            entityOperations,
            concreteEntity: entity,
        });

        const connectionOperation = new ConnectionReadOperation({
            target: new ConcreteEntityAdapter(entity),
            selection,
            fields,
        });
        return connectionOperation;
    }

    private parseConnectionSelection({ entity }: { entity: ConcreteEntity }): EntitySelection {
        return new NodeSelection({
            target: new ConcreteEntityAdapter(entity),
        });
    }

    private parseConnectionFields({
        fields,
        entityOperations,
        concreteEntity,
    }: {
        fields: Record<string, ResolveTree>;
        entityOperations: AuraEntityOperations;
        concreteEntity: ConcreteEntity;
    }): {
        node: Field[];
        edge: Field[];
    } {
        const res = this.splitConnectionFields(fields);

        const nodeFields = res.node?.fieldsByTypeName[entityOperations.nodeType] ?? {};
        // const nodeFields;
        const nodeFields2 = Object.values(nodeFields).map((rawField) => {
            return new AttributeField({
                alias: rawField.alias,
                attribute: new AttributeAdapter(concreteEntity.attributes.get(rawField.name)!),
            });
        });
        return {
            node: nodeFields2,
            edge: [],
        };
    }

    private splitConnectionFields(rawFields: Record<string, ResolveTree>): {
        node: ResolveTree | undefined;
        edge: ResolveTree | undefined;
        fields: Record<string, ResolveTree>;
    } {
        let nodeField: ResolveTree | undefined;
        let edgeField: ResolveTree | undefined;

        const fields: Record<string, ResolveTree> = {};

        Object.entries(rawFields).forEach(([key, field]) => {
            if (field.name === "node") {
                nodeField = field;
            } else if (field.name === "edge") {
                edgeField = field;
            } else {
                fields[key] = field;
            }
        });

        return {
            node: nodeField,
            edge: edgeField,
            fields,
        };
    }
}
