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

import type { GraphQLDirective, GraphQLScalarType } from "graphql";
import { GraphQLObjectType, GraphQLSchema, GraphQLString } from "graphql";
import { directives, scalars, objects } from "@neo4j/graphql";

export const getSchemaForLintAndAutocompletion = (): GraphQLSchema => {
    return new GraphQLSchema({
        query: new GraphQLObjectType({
            name: "Query",
            fields: {
                _ignore: {
                    type: GraphQLString,
                    resolve: () => {
                        return "Hello from GraphQL";
                    },
                },
            },
        }),
        directives: [...Object.values(directives as Record<string, GraphQLDirective>)],
        types: [
            ...Object.values(scalars as Record<string, GraphQLScalarType>),
            ...Object.values(objects as Record<string, GraphQLObjectType>),
        ],
    });
};
