/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 *
 * This file is part of Neo4j.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { mergeDeep } from "@graphql-tools/utils";
import { isObject, isString } from "graphql-compose";
import type { ResolveTree } from "graphql-parse-resolve-info";
import { cursorToOffset } from "graphql-relay";
import { Integer } from "neo4j-driver";
import type { EntityAdapter } from "../../../../schema-model/entity/EntityAdapter";
import { InterfaceEntity } from "../../../../schema-model/entity/InterfaceEntity";
import { ConcreteEntityAdapter } from "../../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import { InterfaceEntityAdapter } from "../../../../schema-model/entity/model-adapters/InterfaceEntityAdapter";
import type { UnionEntityAdapter } from "../../../../schema-model/entity/model-adapters/UnionEntityAdapter";
import type { RelationshipAdapter } from "../../../../schema-model/relationship/model-adapters/RelationshipAdapter";
import type { ConnectionQueryArgs } from "../../../../types";
import type { Neo4jGraphQLTranslationContext } from "../../../../types/neo4j-graphql-translation-context";
import { filterTruthy } from "../../../../utils/utils";
import { checkEntityAuthentication } from "../../../authorization/check-authentication";
import type { Field } from "../../ast/fields/Field";
import { ConnectionReadOperation } from "../../ast/operations/ConnectionReadOperation";
import { CompositeConnectionPartial } from "../../ast/operations/composite/CompositeConnectionPartial";
import { CompositeConnectionReadOperation } from "../../ast/operations/composite/CompositeConnectionReadOperation";
import type { EntitySelection } from "../../ast/selection/EntitySelection";
import { NodeSelection } from "../../ast/selection/NodeSelection";
import { RelationshipSelection } from "../../ast/selection/RelationshipSelection";
import { getConcreteEntities } from "../../utils/get-concrete-entities";
import { isConcreteEntity } from "../../utils/is-concrete-entity";
import { isInterfaceEntity } from "../../utils/is-interface-entity";
import { isUnionEntity } from "../../utils/is-union-entity";
import type { QueryASTFactory } from "../QueryASTFactory";
import { findFieldsByNameInFieldsByTypeNameField } from "../parsers/find-fields-by-name-in-fields-by-type-name-field";
import { getFieldsByTypeName } from "../parsers/get-fields-by-type-name";

export class ConnectionFactory {
    private queryASTFactory: QueryASTFactory;

    constructor(queryASTFactory: QueryASTFactory) {
        this.queryASTFactory = queryASTFactory;
    }

    public createCompositeConnectionOperationAST({
        relationship,
        target,
        resolveTree,
        context,
    }: {
        relationship?: RelationshipAdapter;
        target: InterfaceEntityAdapter | UnionEntityAdapter;
        resolveTree: ResolveTree;
        context: Neo4jGraphQLTranslationContext;
    }): CompositeConnectionReadOperation {
        const directed = Boolean(resolveTree.args.directed) ?? true;
        const resolveTreeWhere: Record<string, any> = this.queryASTFactory.operationsFactory.getWhereArgs(resolveTree);

        let nodeWhere: Record<string, any>;
        if (isInterfaceEntity(target)) {
            nodeWhere = isObject(resolveTreeWhere) ? resolveTreeWhere.node : {};
        } else {
            nodeWhere = resolveTreeWhere;
        }

        const concreteEntities = getConcreteEntities(target, nodeWhere);
        const concreteConnectionOperations = concreteEntities.map((concreteEntity: ConcreteEntityAdapter) => {
            let selection: EntitySelection;

            if (relationship) {
                selection = new RelationshipSelection({
                    relationship,
                    directed,
                    targetOverride: concreteEntity,
                });
            } else {
                selection = new NodeSelection({
                    target: concreteEntity,
                });
            }

            const connectionPartial = new CompositeConnectionPartial({
                relationship,
                directed,
                target: concreteEntity,
                selection,
            });

            return this.hydrateConnectionOperationAST({
                relationship,
                target: concreteEntity,
                resolveTree,
                context,
                operation: connectionPartial,
                whereArgs: resolveTreeWhere,
            });
        });

        const compositeConnectionOp = new CompositeConnectionReadOperation(concreteConnectionOperations);

        // These sort fields will be duplicated on nested "CompositeConnectionPartial"

        // TODO: this if shouldn't be needed
        if (relationship) {
            this.hydrateConnectionOperationsASTWithSort({
                entityOrRel: relationship,
                resolveTree,
                operation: compositeConnectionOp,
                context,
            });
        }
        return compositeConnectionOp;
    }

    public createConnectionOperationAST({
        relationship,
        target,
        resolveTree,
        context,
    }: {
        relationship?: RelationshipAdapter;
        target: EntityAdapter;
        resolveTree: ResolveTree;
        context: Neo4jGraphQLTranslationContext;
    }): ConnectionReadOperation | CompositeConnectionReadOperation {
        if (!(target instanceof ConcreteEntityAdapter)) {
            return this.createCompositeConnectionOperationAST({
                relationship,
                target,
                resolveTree,
                context,
            });
        }
        const directed = Boolean(resolveTree.args.directed) ?? true;
        const resolveTreeWhere: Record<string, any> = this.queryASTFactory.operationsFactory.getWhereArgs(resolveTree);
        checkEntityAuthentication({
            entity: target.entity,
            targetOperations: ["READ"],
            context,
        });

        let selection: EntitySelection;
        if (relationship) {
            selection = new RelationshipSelection({
                relationship,
                directed: Boolean(resolveTree.args?.directed ?? true),
            });
        } else {
            selection = new NodeSelection({
                target,
            });
        }
        const operation = new ConnectionReadOperation({ relationship, directed, target, selection });

        return this.hydrateConnectionOperationAST({
            relationship: relationship,
            target: target,
            resolveTree,
            context,
            operation,
            whereArgs: resolveTreeWhere,
        });
    }

    // eslint-disable-next-line @typescript-eslint/comma-dangle
    private hydrateConnectionOperationsASTWithSort<
        T extends ConnectionReadOperation | CompositeConnectionReadOperation
    >({
        entityOrRel,
        resolveTree,
        operation,
        context,
    }: {
        entityOrRel: ConcreteEntityAdapter | RelationshipAdapter;
        resolveTree: ResolveTree;
        operation: T;
        context: Neo4jGraphQLTranslationContext;
    }): T {
        let options: Pick<ConnectionQueryArgs, "first" | "after" | "sort"> | undefined;
        const target = isConcreteEntity(entityOrRel) ? entityOrRel : entityOrRel.target;
        if (!isUnionEntity(target)) {
            options = this.queryASTFactory.operationsFactory.getConnectionOptions(target, resolveTree.args);
        } else {
            options = resolveTree.args;
        }
        const first = options?.first;
        const sort = options?.sort;

        const afterArg = options?.after;
        const offset = isString(afterArg) ? cursorToOffset(afterArg) + 1 : undefined;

        if (first || offset) {
            const pagination = this.queryASTFactory.sortAndPaginationFactory.createPagination({
                limit: first,
                offset,
            });
            if (pagination) {
                operation.addPagination(pagination);
            }
        }

        if (sort) {
            sort.forEach((options) => {
                const sort = this.queryASTFactory.sortAndPaginationFactory.createConnectionSortFields(
                    options,
                    entityOrRel,
                    context
                );
                operation.addSort(sort);
            });
        }

        return operation;
    }
    // The current top-level Connection API is inconsistent with the rest of the API making the parsing more complex than it should be.
    // This function temporary adjust some inconsistencies waiting for the new API.
    // TODO: Remove it when the new API is ready.
    public normalizeResolveTreeForTopLevelConnection(resolveTree: ResolveTree): ResolveTree {
        const topLevelConnectionResolveTree = Object.assign({}, resolveTree);
        // Move the sort arguments inside a "node" object.
        if (topLevelConnectionResolveTree.args.sort) {
            topLevelConnectionResolveTree.args.sort = (resolveTree.args.sort as any[]).map((sortField) => {
                return { node: sortField };
            });
        }
        // move the where arguments inside a "node" object.
        if (topLevelConnectionResolveTree.args.where) {
            topLevelConnectionResolveTree.args.where = { node: resolveTree.args.where };
        }
        return topLevelConnectionResolveTree;
    }

    private hydrateConnectionOperationAST<T extends ConnectionReadOperation>({
        relationship,
        target,
        resolveTree,
        context,
        operation,
        whereArgs,
    }: {
        relationship?: RelationshipAdapter;
        target: ConcreteEntityAdapter;
        resolveTree: ResolveTree;
        context: Neo4jGraphQLTranslationContext;
        operation: T;
        whereArgs: Record<string, any>;
    }): T {
        // hydrate hydrateConnectionOperationAST is used for both top-level and nested connections.
        // If the relationship is defined use the RelationshipAdapter to infer the typeNames, if not use the target.

        // Get the abstract types of the interface
        const entityInterfaces = filterTruthy(
            target.compositeEntities.map((compositeEntity) => {
                if (compositeEntity instanceof InterfaceEntity) {
                    return new InterfaceEntityAdapter(compositeEntity);
                }
            })
        );

        const interfacesFields = entityInterfaces.map((interfaceAdapter) => {
            return resolveTree.fieldsByTypeName[interfaceAdapter.operations.connectionFieldTypename] ?? {};
        });

        const entityOrRel = relationship ?? target;

        const concreteProjectionFields = {
            ...resolveTree.fieldsByTypeName[entityOrRel.operations.connectionFieldTypename],
        };

        const resolveTreeConnectionFields = mergeDeep<Record<string, ResolveTree>[]>([
            ...interfacesFields,
            concreteProjectionFields,
        ]);

        const edgeFieldsRaw = findFieldsByNameInFieldsByTypeNameField(resolveTreeConnectionFields, "edges");

        const interfacesEdgeFields = entityInterfaces.map((interfaceAdapter) => {
            return getFieldsByTypeName(edgeFieldsRaw, `${interfaceAdapter.name}Edge`);
        });

        const concreteEdgeFields = getFieldsByTypeName(
            edgeFieldsRaw,
            entityOrRel.operations.relationshipFieldTypename // Use interface operation
        );

        const resolveTreeEdgeFields = mergeDeep<Record<string, ResolveTree>[]>([
            ...interfacesEdgeFields,
            concreteEdgeFields,
        ]);

        const nodeFieldsRaw = findFieldsByNameInFieldsByTypeNameField(resolveTreeEdgeFields, "node");
        const propertiesFieldsRaw = findFieldsByNameInFieldsByTypeNameField(resolveTreeEdgeFields, "properties");
        this.hydrateConnectionOperationsASTWithSort({
            entityOrRel,
            resolveTree,
            operation,
            context,
        });
        const isTopLevel = !relationship;

        const resolveTreeNodeFieldsTypesNames = [
            target.name,
            ...target.compositeEntities.filter((e) => e instanceof InterfaceEntity).map((e) => e.name),
        ];
        if (!isTopLevel) {
            resolveTreeNodeFieldsTypesNames.push(relationship.target.name);
        }

        const resolveTreeNodeFields = getFieldsByTypeName(nodeFieldsRaw, resolveTreeNodeFieldsTypesNames);
        const nodeFields = this.queryASTFactory.fieldFactory.createFields(target, resolveTreeNodeFields, context);

        let edgeFields: Field[] = [];
        if (!isTopLevel && relationship.propertiesTypeName) {
            const resolveTreePropertiesFields = getFieldsByTypeName(propertiesFieldsRaw, [
                relationship.propertiesTypeName,
            ]);
            edgeFields = this.queryASTFactory.fieldFactory.createFields(
                relationship,
                resolveTreePropertiesFields,
                context
            );
        }

        const authFilters = this.queryASTFactory.authorizationFactory.getAuthFilters({
            entity: target,
            operations: ["READ"],
            attributes: this.queryASTFactory.operationsFactory.getSelectedAttributes(target, resolveTreeNodeFields),
            context,
        });
        const filters = this.queryASTFactory.filterFactory.createConnectionPredicates({
            rel: relationship,
            entity: target,
            where: whereArgs,
        });

        operation.setNodeFields(nodeFields);
        operation.setEdgeFields(edgeFields);
        operation.addFilters(...filters);
        operation.addAuthFilters(...authFilters);

        return operation;
    }

    public splitConnectionFields(rawFields: Record<string, ResolveTree>): {
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

    public getConnectionOptions(
        entity: ConcreteEntityAdapter | InterfaceEntityAdapter,
        options: Record<string, any>
    ): Pick<ConnectionQueryArgs, "first" | "after" | "sort"> | undefined {
        const limitDirective = entity.annotations.limit;

        let limit: Integer | number | undefined = options?.first ?? limitDirective?.default ?? limitDirective?.max;
        if (limit instanceof Integer) {
            limit = limit.toNumber();
        }
        const maxLimit = limitDirective?.max;
        if (limit !== undefined && maxLimit !== undefined) {
            limit = Math.min(limit, maxLimit);
        }

        if (limit === undefined && options.after === undefined && options.sort === undefined) return undefined;

        return {
            first: limit,
            after: options.after,
            sort: options.sort,
        };
    }
}
