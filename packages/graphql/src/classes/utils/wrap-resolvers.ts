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

import type { Neo4jGraphQLSchemaModel } from "../../schema-model/Neo4jGraphQLSchemaModel";
import { isAuthenticated } from "../../translate/authorization/check-authentication";

export function wrapQueryFields(
    schemaModel: Neo4jGraphQLSchemaModel,
    wrappers: ((next: any) => (root: any, args: any, context: any, info: any) => any)[]
) {
    const { userCustomResolverPattern, generatedResolverPattern } = getPathMatcherForRootType("Query", schemaModel);
    return {
        [`Query.${userCustomResolverPattern}`]: [...wrappers, isAuthenticated(["READ"], schemaModel.operations.Query)],
        [`Query.${generatedResolverPattern}`]: wrappers,
    };
}

export function wrapMutationFields(
    schemaModel: Neo4jGraphQLSchemaModel,
    wrappers: ((next: any) => (root: any, args: any, context: any, info: any) => any)[]
) {
    const { userCustomResolverPattern, generatedResolverPattern } = getPathMatcherForRootType("Mutation", schemaModel);
    return {
        [`Mutation.${userCustomResolverPattern}`]: [
            ...wrappers,
            isAuthenticated(["CREATE", "UPDATE", "DELETE"], schemaModel.operations.Mutation),
        ],
        [`Mutation.${generatedResolverPattern}`]: wrappers,
    };
}

function getPathMatcherForRootType(
    rootType: "Query" | "Mutation",
    schemaModel: Neo4jGraphQLSchemaModel
): {
    userCustomResolverPattern: string;
    generatedResolverPattern: string;
} {
    const operation = schemaModel.operations[rootType];
    if (!operation) {
        return { userCustomResolverPattern: "*", generatedResolverPattern: "*" };
    }
    const userDefinedFields = Array.from(operation.userResolvedAttributes.keys());
    if (!userDefinedFields.length) {
        return { userCustomResolverPattern: "*", generatedResolverPattern: "*" };
    }
    const userCustomResolverPattern = `{${userDefinedFields.join(", ")}}`;
    return { userCustomResolverPattern, generatedResolverPattern: `!${userCustomResolverPattern}` };
}
