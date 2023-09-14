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

import type { ConcreteEntityAdapter } from "../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { InterfaceEntityAdapter } from "../../../schema-model/entity/model-adapters/InterfaceEntityAdapter";
import { UnionEntityAdapter } from "../../../schema-model/entity/model-adapters/UnionEntityAdapter";
import type { RelationshipAdapter } from "../../../schema-model/relationship/model-adapters/RelationshipAdapter";
import type { ConnectionSortArg, GraphQLOptionsArg, GraphQLSortArg } from "../../../types";
import { Pagination } from "../ast/pagination/Pagination";
import { CypherPropertySort } from "../ast/sort/CypherPropertySort";
import { PropertySort } from "../ast/sort/PropertySort";
import type { Sort } from "../ast/sort/Sort";
import { isUnionEntity } from "../utils/is-union-entity";

export class SortAndPaginationFactory {
    public createSortFields(options: GraphQLOptionsArg, entity: ConcreteEntityAdapter | RelationshipAdapter): Sort[] {
        return (options.sort || [])?.flatMap((s) => this.createPropertySort(s, entity));
    }

    public createConnectionSortFields(
        options: ConnectionSortArg,
        relationship: RelationshipAdapter
    ): { edge: Sort[]; node: Sort[] } {
        const nodeSortFields = this.createPropertySort(options.node || {}, relationship.target);
        const edgeSortFields = this.createPropertySort(options.edge || {}, relationship);
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
        optionArg: GraphQLSortArg,
        entity: ConcreteEntityAdapter | InterfaceEntityAdapter | RelationshipAdapter | UnionEntityAdapter
    ): Sort[] {
        if (isUnionEntity(entity)) {
            return [];
        }

        return Object.entries(optionArg).map(([fieldName, sortDir]) => {
            const attribute = entity.findAttribute(fieldName);
            if (!attribute) throw new Error(`no filter attribute ${fieldName}`);
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
