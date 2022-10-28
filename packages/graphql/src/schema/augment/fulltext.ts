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

import type { SchemaComposer } from "graphql-compose";
import type { Node } from "../../classes";
import { fulltextResolver } from "../resolvers/query/fulltext";
import { upperFirst } from "../../utils/upper-first";
import { SCORE_FIELD } from "../../graphql/directives/fulltext";

const fulltextScoreWhereType = "FulltextScoreWhere";

export function augmentFulltextSchema(
    node: Node,
    composer: SchemaComposer,
    nodeWhereTypeName: string,
    nodeSortTypeName: string
) {
    if (node.fulltextDirective) {
        const fields = node.fulltextDirective.indexes.reduce(
            (res, index) => ({
                ...res,
                [index.name]: composer.createInputTC({
                    name: `${node.name}${upperFirst(index.name)}Fulltext`,
                    fields: {
                        phrase: "String!",
                    },
                }),
            }),
            {}
        );

        const fulltextResultDescription = `The result of a fulltext search on an index of ${node.name}`;
        const fulltextWhereDescription = `The input for filtering a fulltext query on an index of ${node.name}`;
        const fulltextSortDescription = `The input for sorting a fulltext query on an index of ${node.name}`;

        composer.createInputTC({
            name: `${node.name}Fulltext`,
            fields,
        });

        composer.createInputTC({
            name: fulltextScoreWhereType,
            description: "The input for filtering the score of a fulltext search",
            fields: {
                min: "Float",
                max: "Float",
            },
        });

        composer.createInputTC({
            name: node.fulltextTypeNames.sort,
            description: fulltextSortDescription,
            fields: {
                [SCORE_FIELD]: "SortDirection",
                [node.singular]: nodeSortTypeName,
            },
        });

        composer.createInputTC({
            name: node.fulltextTypeNames.where,
            description: fulltextWhereDescription,
            fields: {
                [SCORE_FIELD]: fulltextScoreWhereType,
                [node.singular]: nodeWhereTypeName,
            },
        });

        composer.createObjectTC({
            name: node.fulltextTypeNames.result,
            description: fulltextResultDescription,
            fields: {
                [SCORE_FIELD]: "Float",
                [node.singular]: node.name,
            },
        });

        node.fulltextDirective.indexes.forEach((index) => {
            let queryName = `${node.plural}Fulltext${upperFirst(index.name)}`;
            if (index.queryName) {
                queryName = index.queryName;
            }
            composer.Query.addFields({
                [queryName]: fulltextResolver({ node }, index),
            });
        });
    }
}
