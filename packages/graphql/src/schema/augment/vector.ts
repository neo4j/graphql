/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { GraphQLFloat, GraphQLInt, GraphQLList, GraphQLNonNull, GraphQLString } from "graphql";
import type { SchemaComposer } from "graphql-compose";

import Cypher from "@neo4j/cypher-builder";
import { type ComplexityEstimatorHelper } from "../../classes/ComplexityEstimatorHelper";
import type { ConcreteEntityAdapter } from "../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { Neo4jFeaturesSettings, VectorContext } from "../../types";
import {
    withVectorResultTypeConnection,
    withVectorSortInputType,
    withVectorWhereInputType,
} from "../generation/vector-input";
import { vectorResolver } from "../resolvers/query/vector";

export function augmentVectorSchema({
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
    if (!concreteEntityAdapter.annotations.vector) {
        return;
    }

    withVectorWhereInputType({ composer, concreteEntityAdapter });

    concreteEntityAdapter.annotations.vector.indexes.forEach((index) => {
        const vectorContext: VectorContext = {
            index,
            queryType: "query",
            queryName: index.queryName,
            scoreVariable: new Cypher.Variable(),
            vectorSettings: features?.vector || {},
        };

        const vectorArgs = {
            where: concreteEntityAdapter.operations.vectorTypeNames.where,
            sort: withVectorSortInputType({ concreteEntityAdapter, composer }).NonNull.List,
            first: features?.limitRequired ? new GraphQLNonNull(GraphQLInt) : GraphQLInt,
            after: GraphQLString,
        };

        if (index.provider !== undefined || index.callback !== undefined) {
            vectorArgs["phrase"] = new GraphQLNonNull(GraphQLString);
        } else {
            vectorArgs["vector"] = new GraphQLList(new GraphQLNonNull(GraphQLFloat));
        }

        complexityEstimatorHelper.registerField("Query", index.queryName);
        composer.Query.addFields({
            [index.queryName]: {
                type: withVectorResultTypeConnection({ composer, concreteEntityAdapter }).NonNull,
                resolve: vectorResolver({ vectorContext, entityAdapter: concreteEntityAdapter }),
                args: vectorArgs,
            },
        });
    });
}
