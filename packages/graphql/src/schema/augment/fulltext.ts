/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { GraphQLInt, GraphQLNonNull, GraphQLString } from "graphql";
import type { SchemaComposer } from "graphql-compose";

import Cypher from "@neo4j/cypher-builder";
import { type ComplexityEstimatorHelper } from "../../classes/ComplexityEstimatorHelper";
import type { ConcreteEntityAdapter } from "../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { FulltextContext, Neo4jFeaturesSettings } from "../../types";
import {
    withFulltextResultTypeConnection,
    withFulltextSortInputType,
    withFulltextWhereInputType,
} from "../generation/fulltext-input";
import { fulltextResolver } from "../resolvers/query/fulltext";

export function augmentFulltextSchema({
    composer,
    concreteEntityAdapter,
    complexityEstimatorHelper,
    features,
}: {
    composer: SchemaComposer;
    concreteEntityAdapter: ConcreteEntityAdapter;
    complexityEstimatorHelper: ComplexityEstimatorHelper;
    features?: Neo4jFeaturesSettings;
}) {
    if (!concreteEntityAdapter.annotations.fulltext) {
        return;
    }

    withFulltextWhereInputType({ composer, concreteEntityAdapter });

    concreteEntityAdapter.annotations.fulltext.indexes.forEach((index) => {
        const fulltextContext: FulltextContext = {
            index,
            queryType: "query",
            queryName: index.queryName,
            scoreVariable: new Cypher.Variable(),
        };

        const fulltextArgs = {
            phrase: new GraphQLNonNull(GraphQLString),
            where: concreteEntityAdapter.operations.fulltextTypeNames.where,
            sort: withFulltextSortInputType({ concreteEntityAdapter, composer }).NonNull.List,
            first: features?.limitRequired ? new GraphQLNonNull(GraphQLInt) : GraphQLInt,
            after: GraphQLString,
        };

        complexityEstimatorHelper.registerField("Query", index.queryName);
        composer.Query.addFields({
            [index.queryName]: {
                type: withFulltextResultTypeConnection({ composer, concreteEntityAdapter }).NonNull,
                resolve: fulltextResolver({ fulltextContext, entityAdapter: concreteEntityAdapter }),
                args: fulltextArgs,
            },
        });
    });
}
