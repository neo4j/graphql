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

import type { DocumentNode } from "graphql";
import { execute, Kind, OperationTypeNode, parse } from "graphql";
import type { GraphQLObjectType, GraphQLResolveInfo, GraphQLSchema } from "graphql/type";
import Cypher from "@neo4j/cypher-builder";
import getNeo4jResolveTree from "../utils/get-neo4j-resolve-tree";
import { Executor } from "./Executor";
import type { Neo4jGraphQLTranslationContext } from "../types/neo4j-graphql-translation-context";
import { translateRead } from "../translate/translate-read";
import { translateCreate } from "../translate/translate-create";
import { translateUpdate } from "../schema/resolvers/mutation/update";
import { translateDelete } from "../translate/translate-delete";
import { translateTopLevelCypher } from "../translate/translate-top-level-cypher";
import { ConcreteEntityAdapter } from "../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { AttributeAdapter } from "../schema-model/attribute/model-adapters/AttributeAdapter";
import { OperationAdapter } from "../schema-model/OperationAdapter";
import type { AuthorizationContext, FulltextContext, Neo4jFeaturesSettings, VectorContext } from "../types";
import type { Neo4jGraphQLSchemaModel } from "../schema-model/Neo4jGraphQLSchemaModel";
import type { Driver } from "neo4j-driver";
import type { Neo4jDatabaseInfo } from "./Neo4jDatabaseInfo";
import type { Maybe } from "graphql/jsutils/Maybe";
import { InterfaceEntity } from "../schema-model/entity/InterfaceEntity";
import { InterfaceEntityAdapter } from "../schema-model/entity/model-adapters/InterfaceEntityAdapter";
import { UnionEntity } from "../schema-model/entity/UnionEntity";
import { UnionEntityAdapter } from "../schema-model/entity/model-adapters/UnionEntityAdapter";
import type { EntityAdapter } from "../schema-model/entity/EntityAdapter";
import { fromGlobalId } from "../utils/global-ids";
import type { FieldsByTypeName, ResolveTree } from "graphql-parse-resolve-info";
import { parseResolveInfo } from "graphql-parse-resolve-info";

type EntityQueryFieldMapping = {
    operationType: "read" | "connection" | "aggregate";
    entityAdapter: EntityAdapter;
};
type EntityMutationFieldMapping = {
    operationType: "create" | "update" | "delete";
    entityAdapter: ConcreteEntityAdapter;
};

type FulltextFieldMapping = {
    operationType: "fulltext";
    entityAdapter: ConcreteEntityAdapter;
    fulltextContext: FulltextContext;
};

type VectorFieldMapping = {
    operationType: "vector";
    entityAdapter: ConcreteEntityAdapter;
    vectorContext: VectorContext;
};

type CustomCypherFieldMapping = {
    operationType: "customCypher";
    attributeAdapter: AttributeAdapter;
    cypherType: "Query" | "Mutation";
};

type GlobalNodeFieldMapping = {
    operationType: "globalNode";
    entities: ConcreteEntityAdapter[];
};

type FieldMapping =
    | EntityQueryFieldMapping
    | EntityMutationFieldMapping
    | FulltextFieldMapping
    | VectorFieldMapping
    | CustomCypherFieldMapping
    | GlobalNodeFieldMapping;

const EMPTY_RESULT: { cypher: string; params: Record<string, unknown> } = {
    cypher: "",
    params: {},
};
export class GraphQL2CypherTranslator {
    private schema: GraphQLSchema;
    private schemaModel: Neo4jGraphQLSchemaModel;
    private features: Neo4jFeaturesSettings;
    private dbInfo: Neo4jDatabaseInfo;
    private executor: Executor;

    private operationsMap: Map<string, FieldMapping>;
    private userResolvedFields: Set<string>;

    constructor({
        executableSchema,
        schemaModel,
        driver,
        features,
        dbInfo,
    }: {
        executableSchema: GraphQLSchema;
        schemaModel: Neo4jGraphQLSchemaModel;
        driver: Driver;
        features: Neo4jFeaturesSettings;
        dbInfo: Neo4jDatabaseInfo;
    }) {
        this.schema = executableSchema;
        this.schemaModel = schemaModel;
        this.features = features;
        this.dbInfo = dbInfo;
        this.executor = new Executor({ executionContext: driver });

        this.operationsMap = this.buildOperationsMap();
        this.userResolvedFields = this.collectUserResolvedFields();
    }

    public async graphql2cypher(
        queryString: string,
        variableValues?: Record<string, unknown>
    ): Promise<{ cypher: string; params: Record<string, unknown> }> {
        const parsed = await this.parseQuery(queryString, variableValues);
        if (!parsed) return EMPTY_RESULT;

        const mapping = this.resolveFieldMapping(parsed.fieldName);
        if (!mapping) return EMPTY_RESULT;

        const normalized = this.normalizeOperation(mapping, parsed);
        if (!normalized) return EMPTY_RESULT;

        const context = this.buildTranslationContext(normalized.resolveTree, normalized.operation);
        return this.translateAndClean(context, normalized.operation);
    }

    private async parseQuery(
        queryString: string,
        variableValues?: Record<string, unknown>
    ): Promise<
        | { info: GraphQLResolveInfo; args: Record<string, unknown>; fieldName: string; resolveTree: ResolveTree }
        | undefined
    > {
        try {
            const document = parse(queryString);
            const { info, args, fieldName } = await this.captureResolveInfo(document, variableValues);
            const resolveTree = getNeo4jResolveTree(info, { args });
            return { info, args, fieldName, resolveTree };
        } catch (_err) {
            console.error("Error during query parsing");
            return undefined;
        }
    }

    private resolveFieldMapping(fieldName: string): FieldMapping | undefined {
        const mapping = this.operationsMap.get(fieldName);
        if (mapping) return mapping;

        if (this.userResolvedFields.has(fieldName)) {
            console.log(`Skipping translation for "${fieldName}": field uses a user-provided JS resolver`);
            return undefined;
        }
        throw new Error(`Could not find operation mapping for field "${fieldName}"`);
    }

    private normalizeOperation(
        mapping: FieldMapping,
        parsed: { resolveTree: ResolveTree; args: Record<string, unknown>; info: GraphQLResolveInfo }
    ): { operation: FieldMapping; resolveTree: ResolveTree } | undefined {
        if (mapping.operationType !== "globalNode") {
            return { operation: mapping, resolveTree: parsed.resolveTree };
        }

        const resolved = this.resolveGlobalNode(mapping, parsed.args, parsed.info);
        if (!resolved) return undefined;

        return {
            operation: { operationType: "read", entityAdapter: resolved.entityAdapter },
            resolveTree: getNeo4jResolveTree(parsed.info, { resolveTree: resolved.syntheticResolveTree }),
        };
    }

    private buildTranslationContext(resolveTree: ResolveTree, operation: FieldMapping): Neo4jGraphQLTranslationContext {
        const authorization: AuthorizationContext = {
            jwtParam: new Cypher.NamedParam("jwt", {}),
            isAuthenticated: false,
            isAuthenticatedParam: new Cypher.NamedParam("isAuthenticated", false),
        };

        return {
            schemaModel: this.schemaModel,
            features: this.features,
            resolveTree,
            executor: this.executor,
            neo4jDatabaseInfo: this.dbInfo,
            fulltext: "fulltextContext" in operation ? operation.fulltextContext : undefined,
            vector: "vectorContext" in operation ? operation.vectorContext : undefined,
            dryRun: true,
            authorization,
        } as Neo4jGraphQLTranslationContext;
    }

    private async translateAndClean(
        context: Neo4jGraphQLTranslationContext,
        operation: FieldMapping
    ): Promise<{ cypher: string; params: Record<string, unknown> }> {
        try {
            const { cypher, params } = await this.translateOperation(context, operation);
            const { jwt: _jwt, isAuthenticated: _isAuth, ...cleanParams } = params;
            return { cypher, params: cleanParams };
        } catch (error) {
            console.error("Error during translation:", error);
            return EMPTY_RESULT;
        }
    }

    private async translateOperation(
        context: Neo4jGraphQLTranslationContext,
        mapping: FieldMapping
    ): Promise<Cypher.CypherResult> {
        switch (mapping.operationType) {
            case "customCypher":
                return translateTopLevelCypher({
                    context,
                    attributeAdapter: mapping.attributeAdapter,
                    type: mapping.cypherType,
                });
            case "read":
            case "fulltext":
            case "vector":
            case "connection":
            case "aggregate":
                return translateRead({ context, entityAdapter: mapping.entityAdapter, varName: "this" });
            case "create":
                return translateCreate({ context, entityAdapter: mapping.entityAdapter });
            case "update":
                return translateUpdate({ context, entityAdapter: mapping.entityAdapter });
            case "delete":
                return translateDelete({ context, entityAdapter: mapping.entityAdapter });
            case "globalNode":
                throw new Error("globalNode should be resolved to a read operation before translation");
        }
    }

    private buildOperationsMap(): Map<string, FieldMapping> {
        const map = new Map<string, FieldMapping>();
        this.registerCompositeEntityOperations(map);
        this.registerConcreteEntityOperations(map);
        this.registerCustomCypherOperations(map);
        this.registerGlobalNodeOperation(map);
        return map;
    }

    private registerCompositeEntityOperations(map: Map<string, FieldMapping>): void {
        for (const entity of this.schemaModel.compositeEntities) {
            if (entity instanceof InterfaceEntity) {
                const adapter = new InterfaceEntityAdapter(entity);
                const fieldNames = adapter.operations.rootTypeFieldNames;
                map.set(fieldNames.read, { entityAdapter: adapter, operationType: "read" });
                map.set(fieldNames.connection, { entityAdapter: adapter, operationType: "connection" });
                map.set(fieldNames.aggregate, { entityAdapter: adapter, operationType: "aggregate" });
            } else if (entity instanceof UnionEntity) {
                const adapter = new UnionEntityAdapter(entity);
                map.set(adapter.operations.rootTypeFieldNames.read, { entityAdapter: adapter, operationType: "read" });
            }
        }
    }

    private registerConcreteEntityOperations(map: Map<string, FieldMapping>): void {
        for (const concreteEntity of this.schemaModel.concreteEntities) {
            const adapter = new ConcreteEntityAdapter(concreteEntity);
            const fieldNames = adapter.operations.rootTypeFieldNames;

            map.set(fieldNames.read, { entityAdapter: adapter, operationType: "read" });
            map.set(fieldNames.create, { entityAdapter: adapter, operationType: "create" });
            map.set(fieldNames.update, { entityAdapter: adapter, operationType: "update" });
            map.set(fieldNames.delete, { entityAdapter: adapter, operationType: "delete" });
            map.set(fieldNames.connection, { entityAdapter: adapter, operationType: "connection" });
            map.set(fieldNames.aggregate, { entityAdapter: adapter, operationType: "aggregate" });

            this.registerFulltextOperations(map, adapter);
            this.registerVectorOperations(map, adapter);
        }
    }

    private registerFulltextOperations(map: Map<string, FieldMapping>, adapter: ConcreteEntityAdapter): void {
        if (!adapter.annotations.fulltext) return;
        for (const index of adapter.annotations.fulltext.indexes) {
            map.set(index.queryName, {
                entityAdapter: adapter,
                operationType: "fulltext",
                fulltextContext: {
                    index,
                    queryType: "query",
                    queryName: index.queryName,
                    scoreVariable: new Cypher.Variable(),
                },
            });
        }
    }

    private registerVectorOperations(map: Map<string, FieldMapping>, adapter: ConcreteEntityAdapter): void {
        if (!adapter.annotations.vector) return;
        for (const index of adapter.annotations.vector.indexes) {
            map.set(index.queryName, {
                entityAdapter: adapter,
                operationType: "vector",
                vectorContext: {
                    index,
                    queryType: "query",
                    queryName: index.queryName,
                    scoreVariable: new Cypher.Variable(),
                    vectorSettings: this.features.vector || {},
                },
            });
        }
    }

    private registerCustomCypherOperations(map: Map<string, FieldMapping>): void {
        for (const type of ["Query", "Mutation"] as const) {
            const operation = this.schemaModel.operations[type];
            if (!operation) continue;
            const operationAdapter = new OperationAdapter(operation);
            for (const [fieldName, attrAdapter] of operationAdapter.attributes) {
                map.set(fieldName, {
                    operationType: "customCypher",
                    attributeAdapter: attrAdapter,
                    cypherType: type,
                });
            }
        }
    }

    private registerGlobalNodeOperation(map: Map<string, FieldMapping>): void {
        const globalNodeEntities = [...this.schemaModel.concreteEntities]
            .map((e) => new ConcreteEntityAdapter(e))
            .filter((a) => a.isGlobalNode());
        if (globalNodeEntities.length > 0) {
            map.set("node", { operationType: "globalNode", entities: globalNodeEntities });
        }
    }

    private collectUserResolvedFields(): Set<string> {
        const fields = new Set<string>();
        for (const type of ["Query", "Mutation"] as const) {
            const operation = this.schemaModel.operations[type];
            if (!operation) continue;
            const operationAdapter = new OperationAdapter(operation);
            for (const [fieldName] of operationAdapter.userResolvedAttributes) {
                fields.add(fieldName);
            }
        }
        return fields;
    }

    private resolveGlobalNode(
        mapping: GlobalNodeFieldMapping,
        args: Record<string, unknown>,
        info: GraphQLResolveInfo
    ): { entityAdapter: ConcreteEntityAdapter; syntheticResolveTree: ResolveTree } | undefined {
        const globalId = args.id;
        if (typeof globalId !== "string") return undefined;

        const { typeName, field, id } = fromGlobalId(globalId);
        if (!typeName || !field || !id) return undefined;

        const entityAdapter = mapping.entities.find((e) => e.name === typeName);
        if (!entityAdapter) return undefined;

        const parseInfo = parseResolveInfo(info) ?? { fieldsByTypeName: {} as FieldsByTypeName };

        const fieldsByTypeName = Object.entries(parseInfo.fieldsByTypeName).reduce<FieldsByTypeName>(
            (res, [key, value]) => {
                if (key === "Node") return res;
                if (key === typeName) {
                    return {
                        ...res,
                        [key]: {
                            ...value,
                            id: { name: "id", alias: "id", args: {}, fieldsByTypeName: {} },
                        },
                    };
                }
                return { ...res, [key]: value };
            },
            {} as FieldsByTypeName
        );

        return {
            entityAdapter,
            syntheticResolveTree: {
                name: entityAdapter.plural,
                alias: "node",
                args: { where: { [`${field}_EQ`]: id } },
                fieldsByTypeName,
            },
        };
    }

    private async captureResolveInfo(
        queryDocument: DocumentNode,
        variableValues?: Record<string, unknown>
    ): Promise<{
        info: GraphQLResolveInfo;
        args: Record<string, unknown>;
        fieldName: string;
    }> {
        const { rootType, targetFieldName } = this.parseQueryDocument(queryDocument);
        const queriedField = rootType?.getFields()[targetFieldName];

        if (!queriedField) {
            throw new Error(`Field "${targetFieldName}" not found on ${rootType?.name ? "Query" : "Mutation"} type`);
        }

        let capturedInfo: GraphQLResolveInfo | undefined;
        let capturedArgs: Record<string, unknown> = {};

        const originalResolve = queriedField.resolve;
        queriedField.resolve = (_root, args, _context, info) => {
            capturedInfo = info;
            capturedArgs = args;
            return null;
        };

        try {
            await execute({ schema: this.schema, document: queryDocument, variableValues: variableValues ?? {} });
        } finally {
            queriedField.resolve = originalResolve;
        }

        if (!capturedInfo) {
            throw new Error(`Failed to capture resolve info for field "${targetFieldName}"`);
        }

        return { info: capturedInfo || ({} as GraphQLResolveInfo), args: capturedArgs, fieldName: targetFieldName };
    }

    private parseQueryDocument(document: DocumentNode): {
        rootType: Maybe<GraphQLObjectType>;
        targetFieldName: string;
    } {
        const operationDef = document.definitions.find((def) => def.kind === Kind.OPERATION_DEFINITION);
        if (!operationDef || operationDef.kind !== Kind.OPERATION_DEFINITION) {
            throw new Error("No operation definition found in document");
        }

        const firstSelection = operationDef.selectionSet.selections.find((sel) => sel.kind === Kind.FIELD);
        if (!firstSelection || firstSelection.kind !== Kind.FIELD) {
            throw new Error("No field selection found in operation");
        }
        const targetFieldName = firstSelection.name.value;

        switch (operationDef.operation) {
            case OperationTypeNode.QUERY:
                return { rootType: this.schema.getQueryType(), targetFieldName };
            case OperationTypeNode.MUTATION:
                return { rootType: this.schema.getMutationType(), targetFieldName };
            default:
                throw new Error(`Unsupported operation type "${operationDef.operation}"`);
        }
    }
}
