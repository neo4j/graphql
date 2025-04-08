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

import { SCORE_FIELD } from "../../../constants";
import type { EntityAdapter } from "../../../schema-model/entity/EntityAdapter";
import { RelationshipAdapter } from "../../../schema-model/relationship/model-adapters/RelationshipAdapter";
import type {
    ConnectionSortArg,
    GraphQLSortArg,
    GraphQLSortingAndPaginationArgs,
    NestedGraphQLSortArg,
} from "../../../types";
import type { Neo4jGraphQLTranslationContext } from "../../../types/neo4j-graphql-translation-context";
import { asArray } from "../../../utils/utils";
import { CypherAttributeOperation } from "../ast/operations/CypherAttributeOperation";
import { Pagination } from "../ast/pagination/Pagination";
import { CypherPropertySort } from "../ast/sort/CypherPropertySort";
import { PropertySort } from "../ast/sort/PropertySort";
import { ScoreSort } from "../ast/sort/ScoreSort";
import type { Sort } from "../ast/sort/Sort";
import { isConcreteEntity } from "../utils/is-concrete-entity";
import { isRelationshipEntity } from "../utils/is-relationship-entity";
import { isUnionEntity } from "../utils/is-union-entity";
import type { QueryASTFactory } from "./QueryASTFactory";

export class SortAndPaginationFactory {
    private queryASTFactory: QueryASTFactory;
    constructor(queryASTFactory: QueryASTFactory) {
        this.queryASTFactory = queryASTFactory;
    }
    public createSortFields(
        options: GraphQLSortingAndPaginationArgs,
        entity: EntityAdapter | RelationshipAdapter,
        context: Neo4jGraphQLTranslationContext
    ): Sort[] {
        // SOFT_DEPRECATION: OPTIONS-ARGUMENT
        return asArray(options.sort).flatMap((s) => {
            return this.createPropertySort({ optionArg: s, entity, context });
        });
    }

    public createConnectionSortFields(
        options: ConnectionSortArg,
        entityOrRel: EntityAdapter | RelationshipAdapter,
        context: Neo4jGraphQLTranslationContext
    ): { edge: Sort[]; node: Sort[] } {
        if (isRelationshipEntity(entityOrRel)) {
            const nodeSortFields = this.createPropertySort({
                optionArg: options.node ?? {},
                entity: entityOrRel.target,
                context,
            });
            const edgeSortFields = this.createPropertySort({
                optionArg: options.edge || {},
                entity: entityOrRel,
                context,
            });
            return {
                edge: edgeSortFields,
                node: nodeSortFields,
            };
        }

        const nodeSortFields = this.createPropertySort({
            optionArg: options.node ?? {},
            entity: entityOrRel,
            context,
        });

        if (options[SCORE_FIELD]) {
            if (context.vector) {
                nodeSortFields.push(
                    new ScoreSort({
                        scoreVariable: context.vector.scoreVariable,
                        direction: options[SCORE_FIELD],
                    })
                );
            } else if (context.fulltext) {
                nodeSortFields.push(
                    new ScoreSort({
                        scoreVariable: context.fulltext.scoreVariable,
                        direction: options[SCORE_FIELD],
                    })
                );
            }
        }

        return {
            edge: [],
            node: nodeSortFields,
        };
    }

    public createPagination(args: GraphQLSortingAndPaginationArgs): Pagination | undefined {
        if (args.limit || args.offset) {
            return new Pagination({
                skip: args.offset,
                limit: args.limit,
            });
        }
    }

    private createPropertySort({
        optionArg,
        entity,
        context,
    }: {
        optionArg: GraphQLSortArg | NestedGraphQLSortArg;
        entity: EntityAdapter | RelationshipAdapter;
        context: Neo4jGraphQLTranslationContext;
    }): Sort[] {
        if (isUnionEntity(entity)) {
            return [];
        }

        if (
            entity instanceof RelationshipAdapter &&
            entity.propertiesTypeName &&
            Object.keys(optionArg).some((k) => (entity.siblings || []).includes(k))
        ) {
            if (!optionArg[entity.propertiesTypeName]) {
                return [];
            }
            return this.createPropertySort({
                optionArg: optionArg[entity.propertiesTypeName] as GraphQLSortArg,
                entity,
                context,
            });
        }

        return Object.entries(optionArg).map(([fieldName, sortDir]) => {
            const attribute = entity.findAttribute(fieldName);
            if (!attribute) {
                throw new Error(`no filter attribute ${fieldName}`);
            }
            if (attribute.annotations.cypher && isConcreteEntity(entity)) {
                const cypherOperation = this.queryASTFactory.operationsFactory.createCustomCypherOperation({
                    context,
                    cypherAttributeField: attribute,
                });
                if (!(cypherOperation instanceof CypherAttributeOperation)) {
                    throw new Error("Transpile error: sorting is supported only for @cypher scalar properties");
                }
                return new CypherPropertySort({
                    direction: sortDir,
                    attribute,
                    cypherOperation,
                });
            }
            return new PropertySort({
                direction: sortDir,
                attribute,
            });
        });
    }
}
