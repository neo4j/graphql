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

import type Cypher from "@neo4j/cypher-builder";
import { SCORE_FIELD } from "../../../graphql/directives/fulltext";
import type { ConcreteEntityAdapter } from "../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { InterfaceEntityAdapter } from "../../../schema-model/entity/model-adapters/InterfaceEntityAdapter";
import type { UnionEntityAdapter } from "../../../schema-model/entity/model-adapters/UnionEntityAdapter";
import { RelationshipAdapter } from "../../../schema-model/relationship/model-adapters/RelationshipAdapter";
import type { ConnectionSortArg, GraphQLOptionsArg, GraphQLSortArg, NestedGraphQLSortArg } from "../../../types";
import { Pagination } from "../ast/pagination/Pagination";
import { CypherPropertySort } from "../ast/sort/CypherPropertySort";
import { FulltextScoreSort } from "../ast/sort/FulltextScoreSort";
import { PropertySort } from "../ast/sort/PropertySort";
import type { Sort } from "../ast/sort/Sort";
import { isConcreteEntity } from "../utils/is-concrete-entity";
import { isUnionEntity } from "../utils/is-union-entity";

export class SortAndPaginationFactory {
    public createSortFields(
        options: GraphQLOptionsArg,
        entity: ConcreteEntityAdapter | RelationshipAdapter | InterfaceEntityAdapter | UnionEntityAdapter,
        scoreVariable?: Cypher.Variable
    ): Sort[] {
        return (options.sort || [])?.flatMap((s) => {
            return this.createPropertySort(s, entity, scoreVariable);
        });
    }

    public createConnectionSortFields(
        options: ConnectionSortArg,
        entityOrRel: ConcreteEntityAdapter | RelationshipAdapter
    ): { edge: Sort[]; node: Sort[] } {
        if (isConcreteEntity(entityOrRel)) {
            const nodeSortFields = this.createPropertySort(options.node || {}, entityOrRel);
            return {
                edge: [],
                node: nodeSortFields,
            };
        }
        const nodeSortFields = this.createPropertySort(options.node || {}, entityOrRel.target);
        const edgeSortFields = this.createPropertySort(options.edge || {}, entityOrRel);
        return {
            edge: edgeSortFields,
            node: nodeSortFields,
        };
    }

    public createPagination(options: GraphQLOptionsArg): Pagination | undefined {
        if (options.limit || options.offset) {
            return new Pagination({
                skip: options.offset,
                limit: options.limit,
            });
        }
    }

    private createPropertySort(
        optionArg: GraphQLSortArg | NestedGraphQLSortArg,
        entity: ConcreteEntityAdapter | InterfaceEntityAdapter | RelationshipAdapter | UnionEntityAdapter,
        scoreVariable?: Cypher.Variable
    ): Sort[] {
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
            return this.createPropertySort(
                optionArg[entity.propertiesTypeName] as GraphQLSortArg,
                entity,
                scoreVariable
            );
        }

        return Object.entries(optionArg).map(([fieldName, sortDir]) => {
            // TODO: fix conflict with a a "score" fieldname
            if (fieldName === SCORE_FIELD && scoreVariable) {
                return new FulltextScoreSort({
                    scoreVariable,
                    direction: sortDir,
                });
            }

            const attribute = entity.findAttribute(fieldName);
            if (!attribute) {
                throw new Error(`no filter attribute ${fieldName}`);
            }
            if (attribute.annotations.cypher) {
                return new CypherPropertySort({
                    direction: sortDir,
                    attribute,
                });
            }
            return new PropertySort({
                direction: sortDir,
                attribute,
            });
        });
    }
}
