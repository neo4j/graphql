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

import type { GraphQLEnumValueConfigMap } from "graphql";
import { GraphQLEnumType, GraphQLFloat, GraphQLNonNull, GraphQLString } from "graphql";
import type { SchemaComposer } from "graphql-compose";
import type { Node } from "../../classes";
import { fulltextResolver } from "../resolvers/query/fulltext";
import { upperFirst } from "../../utils/upper-first";
import { FloatWhere } from "../../graphql/input-objects/FloatWhere";
import { SCORE_FIELD } from "../../graphql/directives/fulltext";

export function createFulltextDeprecationMessage(node: Node, type = "argument") {
    return `This ${type} has been deprecated and will be removed in version 4.0.0 of the library.
Please use the fulltext argument in ${node.plural}Connection with index you wish to query instead.
More information about the changes to @fulltext can be found here:
https://neo4j.com/docs/graphql-manual/current/guides/v4-migration/#_fulltext_changes.
`;
}

const fulltextArgDeprecationMessageInArgument =
    "This argument has been deprecated and will be removed in version 4.0.0 of the library. " +
    "Please use the phrase and index arguments instead. " +
    "More information about the changes to @fulltext can be found here: " +
    "https://neo4j.com/docs/graphql-manual/current/guides/v4-migration/#_fulltext_changes.";

function createEnumType(name: string, rawValues: string[]): GraphQLEnumType {
    const values = rawValues.reduce((acc: GraphQLEnumValueConfigMap, value) => {
        return {
            ...acc,
            [value]: {
                value,
            },
        };
    }, {});

    return new GraphQLEnumType({
        name: `${name}FulltextIndexes`,
        values,
    });
}

export function augmentFulltextSchema(
    node: Node,
    composer: SchemaComposer,
    nodeWhereTypeName: string,
    nodeSortTypeName: string
) {
    if (node.fulltextDirective) {
        const indexes = node.fulltextDirective.indexes.map((index) => {
            const indexName = index.indexName || index.name;
            if (indexName === undefined) {
                throw new Error("The name of the fulltext index should be defined using the indexName argument.");
            }
            return indexName;
        });

        const indexEnumType = createEnumType(node.name, indexes);
        const indexEnum = composer.createEnumTC(indexEnumType);

        const legacyFields = node.fulltextDirective.indexes.reduce((res, index) => {
            const indexName = index.indexName || index.name;
            if (indexName === undefined) {
                throw new Error("The name of the fulltext index should be defined using the indexName argument.");
            }

            composer.createInputTC({
                name: `${node.name}${upperFirst(indexName)}Fulltext`,
                fields: {
                    phrase: new GraphQLNonNull(GraphQLString),
                },
            });

            return {
                ...res,
                [indexName]: {
                    type: `${node.name}${upperFirst(indexName)}Fulltext`,
                    directives: [
                        {
                            name: "deprecated",
                            args: {
                                reason: fulltextArgDeprecationMessageInArgument,
                            },
                        },
                    ],
                },
            };
        }, {});

        const fulltextResultDescription = `The result of a fulltext search on an index of ${node.name}`;
        const fulltextWhereDescription = `The input for filtering a fulltext query on an index of ${node.name}`;
        const fulltextSortDescription = `The input for sorting a fulltext query on an index of ${node.name}`;

        // Sets a default index if there is only one index available
        let defaultIndex: string | undefined = undefined;
        if (indexes.length === 1) {
            defaultIndex = indexes[0];
        }

        composer.createInputTC({
            name: `${node.name}Fulltext`,
            fields: {
                phrase: {
                    type: "String", // TODO: make it required on 4.0
                },
                index: {
                    type: indexEnum,
                    defaultValue: defaultIndex,
                },
                ...legacyFields,
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
                [SCORE_FIELD]: FloatWhere.name,
                [node.singular]: nodeWhereTypeName,
            },
        });

        if (node.federationResolvable) {
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
}
