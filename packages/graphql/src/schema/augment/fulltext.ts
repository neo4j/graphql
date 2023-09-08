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

import { GraphQLFloat, GraphQLNonNull, GraphQLString } from "graphql";
import type { SchemaComposer } from "graphql-compose";
import type { Node } from "../../classes";
import { SCORE_FIELD } from "../../graphql/directives/fulltext";
import { FloatWhere } from "../../graphql/input-objects/FloatWhere";
import type { ConcreteEntityAdapter } from "../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import { upperFirst } from "../../utils/upper-first";
import { fulltextResolver } from "../resolvers/query/fulltext";

export function augmentFulltextSchema(
    node: Node,
    composer: SchemaComposer,
    nodeWhereTypeName: string,
    nodeSortTypeName: string
) {
    if (node.fulltextDirective) {
        const fields = node.fulltextDirective.indexes.reduce((res, index) => {
            const indexName = index.indexName || index.name;
            if (indexName === undefined) {
                throw new Error("The name of the fulltext index should be defined using the indexName argument.");
            }
            return {
                ...res,
                [indexName]: composer.createInputTC({
                    name: `${node.name}${upperFirst(indexName)}Fulltext`,
                    fields: {
                        phrase: new GraphQLNonNull(GraphQLString),
                    },
                }),
            };
        }, {});

        const fulltextResultDescription = `The result of a fulltext search on an index of ${node.name}`;
        const fulltextWhereDescription = `The input for filtering a fulltext query on an index of ${node.name}`;
        const fulltextSortDescription = `The input for sorting a fulltext query on an index of ${node.name}`;

        composer.createInputTC({
            name: `${node.name}Fulltext`,
            fields,
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
                [SCORE_FIELD]: FloatWhere.name,
                [node.singular]: nodeWhereTypeName,
            },
        });

        composer.createObjectTC({
            name: node.fulltextTypeNames.result,
            description: fulltextResultDescription,
            fields: {
                [SCORE_FIELD]: new GraphQLNonNull(GraphQLFloat),
                [node.singular]: `${node.name}!`,
            },
        });

        node.fulltextDirective.indexes.forEach((index) => {
            // TODO: remove indexName assignment and undefined check once the name argument has been removed.
            const indexName = index.indexName || index.name;
            if (indexName === undefined) {
                throw new Error("The name of the fulltext index should be defined using the indexName argument.");
            }
            let queryName = `${node.plural}Fulltext${upperFirst(indexName)}`;
            if (index.queryName) {
                queryName = index.queryName;
            }
            composer.Query.addFields({
                [queryName]: fulltextResolver({ node }, index),
            });
        });
    }
}

export function augmentFulltextSchema2(
    node: Node,
    composer: SchemaComposer,
    concreteEntityAdapter: ConcreteEntityAdapter
) {
    if (!node.fulltextDirective) {
        return;
    }

    const fields = node.fulltextDirective.indexes.reduce((res, index) => {
        const indexName = index.indexName || index.name;
        if (indexName === undefined) {
            throw new Error("The name of the fulltext index should be defined using the indexName argument.");
        }
        return {
            ...res,
            [indexName]: composer.createInputTC({
                name: `${concreteEntityAdapter.name}${upperFirst(indexName)}Fulltext`,
                fields: {
                    phrase: new GraphQLNonNull(GraphQLString),
                },
            }),
        };
    }, {});

    const fulltextResultDescription = `The result of a fulltext search on an index of ${concreteEntityAdapter.name}`;
    const fulltextWhereDescription = `The input for filtering a fulltext query on an index of ${concreteEntityAdapter.name}`;
    const fulltextSortDescription = `The input for sorting a fulltext query on an index of ${concreteEntityAdapter.name}`;

    composer.createInputTC({
        name: concreteEntityAdapter.operations.fullTextInputTypeName,
        fields,
    });

    composer.createInputTC({
        name: node.fulltextTypeNames.sort,
        description: fulltextSortDescription,
        fields: {
            [SCORE_FIELD]: "SortDirection",
            [node.singular]: concreteEntityAdapter.operations.sortInputTypeName,
        },
    });

    composer.createInputTC({
        name: node.fulltextTypeNames.where,
        description: fulltextWhereDescription,
        fields: {
            [SCORE_FIELD]: FloatWhere.name,
            [node.singular]: concreteEntityAdapter.operations.whereInputTypeName,
        },
    });

    composer.createObjectTC({
        name: node.fulltextTypeNames.result,
        description: fulltextResultDescription,
        fields: {
            [SCORE_FIELD]: new GraphQLNonNull(GraphQLFloat),
            [node.singular]: `${node.name}!`,
        },
    });

    // TODO: to move this over to the concreteEntityAdapter we need to check what the use of
    // the queryType and scoreVariable properties are in FulltextContext
    // and determine if we can remove them
    node.fulltextDirective.indexes.forEach((index) => {
        // TODO: remove indexName assignment and undefined check once the name argument has been removed.
        const indexName = index.indexName || index.name;
        if (indexName === undefined) {
            throw new Error("The name of the fulltext index should be defined using the indexName argument.");
        }
        let queryName = `${node.plural}Fulltext${upperFirst(indexName)}`;
        if (index.queryName) {
            queryName = index.queryName;
        }
        composer.Query.addFields({
            [queryName]: fulltextResolver({ node }, index),
        });
    });
}
