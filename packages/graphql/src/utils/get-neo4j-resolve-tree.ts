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

import {
    GraphQLField,
    GraphQLInterfaceType,
    GraphQLNamedType,
    GraphQLNonNull,
    GraphQLObjectType,
    GraphQLResolveInfo,
    GraphQLInputObjectType,
    GraphQLInputType,
    GraphQLList,
    GraphQLScalarType,
} from "graphql";
import { parseResolveInfo, ResolveTree } from "graphql-parse-resolve-info";
import neo4j from "neo4j-driver";

function getNeo4jArgumentValue({ argument, type }: { argument: unknown | unknown[]; type: GraphQLInputType }) {
    if (argument === null) {
        return argument;
    }

    if (type.toString().endsWith("!")) {
        return getNeo4jArgumentValue({ argument, type: (type as GraphQLNonNull<any>).ofType });
    }

    if (type.toString().startsWith("[") && type.toString().endsWith("]")) {
        return (argument as unknown[]).map((a) =>
            getNeo4jArgumentValue({ argument: a, type: (type as GraphQLList<any>).ofType })
        );
    }

    if (type instanceof GraphQLInputObjectType) {
        return Object.entries(argument as Record<string, unknown>).reduce((res, [key, value]) => {
            const field = Object.values(type.getFields()).find((f) => f.name === key);

            if (!field) {
                throw new Error(
                    `Error whilst generating Neo4j resolve tree: could not find field ${key} in type ${type.name}`
                );
            }

            return {
                ...res,
                [key]: getNeo4jArgumentValue({ argument: value, type: field.type }),
            };
        }, {});
    }

    if (type instanceof GraphQLScalarType) {
        return type.name === "Int" ? neo4j.int(argument as number) : argument;
    }

    return argument;
}

interface GetNeo4jResolveTreeOptions {
    resolveTree: ResolveTree;
    field: GraphQLField<any, any>;
}

function getNeo4jResolveTree(resolveInfo: GraphQLResolveInfo, options?: GetNeo4jResolveTreeOptions) {
    const resolveTree = options?.resolveTree || (parseResolveInfo(resolveInfo) as ResolveTree);

    let field: GraphQLField<any, any>;

    if (options?.field) {
        field = options.field;
    } else {
        const queryType = resolveInfo.schema.getQueryType();
        const mutationType = resolveInfo.schema.getMutationType();

        field = Object.values({ ...queryType?.getFields(), ...mutationType?.getFields() }).find(
            (f) => f.name === resolveTree.name
        ) as GraphQLField<any, any>;
    }

    const args = Object.entries(resolveTree.args).reduce((res, [name, value]) => {
        const argument = field.args.find((arg) => arg.name === name);

        if (!argument) {
            throw new Error(
                `Error whilst generating Neo4j resolve tree: could not find argument ${name} on field ${field.name}`
            );
        }

        return {
            ...res,
            [name]: getNeo4jArgumentValue({ argument: value, type: argument.type }),
        };
    }, {});

    const fieldsByTypeName = Object.entries(resolveTree.fieldsByTypeName).reduce((res, [typeName, fields]) => {
        let type: GraphQLObjectType | GraphQLInterfaceType;

        // eslint-disable-next-line no-underscore-dangle,@typescript-eslint/naming-convention
        const _type = resolveInfo.schema.getType(typeName) as GraphQLNamedType;

        if (!_type) {
            throw new Error(
                `Error whilst generating Neo4j resolve tree: could not find type with name ${typeName} in schema`
            );
        }

        /* isTypeOf and resolveType are defining for GraphQLObjectType and GraphQLInterfaceType */
        if ((_type as GraphQLObjectType).isTypeOf) {
            type = _type as GraphQLObjectType;
        } else if ((_type as GraphQLInterfaceType).resolveType) {
            type = _type as GraphQLInterfaceType;
        } else {
            return {
                ...res,
                [typeName]: fields,
            };
        }

        const resolveTrees = Object.entries(fields).reduce((trees, [fieldName, f]) => {
            return {
                ...trees,
                [fieldName]: getNeo4jResolveTree(resolveInfo, {
                    resolveTree: f,
                    field: Object.values(type.getFields()).find(
                        (typeField) => typeField.name === f.name
                    ) as GraphQLField<any, any>,
                }),
            };
        }, {});

        return {
            ...res,
            [typeName]: resolveTrees,
        };
    }, {});

    const { alias, name } = resolveTree;

    return { alias, args, fieldsByTypeName, name } as ResolveTree;
}

export default getNeo4jResolveTree;
