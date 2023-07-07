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

import type { Neo4jGraphQLSchemaModel } from "../../../schema-model/Neo4jGraphQLSchemaModel";
import type { ResolveTree } from "graphql-parse-resolve-info";
import type { ConcreteEntity } from "../../../schema-model/entity/ConcreteEntity";
import { ConnectionReadOperation, Operation } from "../ast/operations";
import { ReadOperation } from "../ast/operations";

import { FilterFactory } from "./FilterFactory";
import { FieldFactory } from "./FieldFactory";
import type { QueryASTFactory } from "./QueryASTFactory";
import type { Relationship } from "../../../schema-model/relationship/Relationship";

export class OperationsFactory {
    private filterFactory: FilterFactory;
    private fieldFactory: FieldFactory;
    private queryASTFactory: QueryASTFactory;

    constructor(queryASTFactory: QueryASTFactory) {
        this.queryASTFactory = queryASTFactory;
        this.filterFactory = new FilterFactory(queryASTFactory);
        this.fieldFactory = new FieldFactory(queryASTFactory);
    }

    public createReadOperationAST(entity: ConcreteEntity, resolveTree: ResolveTree): ReadOperation {
        const projectionFields = { ...resolveTree.fieldsByTypeName[entity.name] };
        const whereArgs = resolveTree.args.where as Record<string, any>;

        const operation = new ReadOperation(entity);
        const fields = this.fieldFactory.createFields(entity, projectionFields);
        const filters = this.filterFactory.createFilters(entity, whereArgs);
        operation.setFields(fields);
        operation.setFilters(filters);
        return operation;
    }

    public createConnectionOperationAST(relationship: Relationship, resolveTree: ResolveTree): ConnectionReadOperation {
        // const projectionFields = { ...resolveTree.fieldsByTypeName[relationship.name] };
        const whereArgs = resolveTree.args.where as Record<string, any>;
        const nodeWhere = whereArgs.node || {};

        const connectionFields = { ...resolveTree.fieldsByTypeName[relationship.connectionFieldTypename] };
        const edgeRawFields = { ...connectionFields.edges?.fieldsByTypeName[relationship.relationshipFieldTypename] };
        console.log(edgeRawFields);
        const nodeRawFields = { ...edgeRawFields.node?.fieldsByTypeName[relationship.target.name] };

        delete edgeRawFields.node;

        const operation = new ConnectionReadOperation(relationship);
        const nodeFields = this.fieldFactory.createFields(relationship.target as ConcreteEntity, nodeRawFields);
        const edgeFields = this.fieldFactory.createRelationshipFields(relationship, edgeRawFields);
        const nodeFilters = this.filterFactory.createFilters(relationship.target as ConcreteEntity, nodeWhere);
        operation.setNodeFields(nodeFields);
        operation.setNodeFilters(nodeFilters);
        operation.setEdgeFields(edgeFields);
        return operation;
        // const fields = this.fieldFactory.createFields(entity, projectionFields);
        // const filters = this.filterFactory.createFilters(entity, whereArgs);
        // operation.setFields(fields);
        // operation.setFilters(filters);
        // return operation;
    }
}
