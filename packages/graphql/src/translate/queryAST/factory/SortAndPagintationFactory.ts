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

import type { ConcreteEntity } from "../../../schema-model/entity/ConcreteEntity";
import type { GraphQLOptionsArg } from "../../../types";
import { Pagination } from "../ast/pagination/Pagination";
import type { Sort } from "../ast/sort/PropertySort";
import { PropertySort } from "../ast/sort/PropertySort";

export class SortAndPaginationFactory {
    public createSortFields(options: GraphQLOptionsArg, entity: ConcreteEntity): Sort[] {
        return (options.sort || [])
            ?.flatMap((s) => Object.entries(s))
            .map(([fieldName, sortDir]) => {
                const attribute = entity.findAttribute(fieldName);
                if (!attribute) throw new Error(`no filter attribute ${fieldName}`);

                return new PropertySort({
                    direction: sortDir,
                    attribute,
                });
            });
    }

    public createPagination(options: GraphQLOptionsArg): Pagination | undefined {
        if (options.limit || options.offset) {
            return new Pagination({
                skip: options.offset,
                limit: options.limit,
            });
        }
    }
}
