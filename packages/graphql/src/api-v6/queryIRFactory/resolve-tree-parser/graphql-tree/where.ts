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

/** Args for `where` in nested connections (with edge -> node) */
export type GraphQLWhereArgs = LogicalOperation<{
    edges?: GraphQLEdgeWhere;
}>;

/** Args for `where` in top level connections only (i.e. no edge available) */
export type GraphQLWhereArgsTopLevel = LogicalOperation<{
    node?: GraphQLNodeWhere;
}>;

export type GraphQLEdgeWhere = LogicalOperation<{
    properties?: Record<string, GraphQLAttributeFilters | null>;
    node?: GraphQLNodeWhere;
}>;

export type GraphQLNodeWhere = LogicalOperation<Record<string, GraphQLNodeFilters | null>>;
export type GraphQLNodeFilters = GraphQLAttributeFilters | RelationshipFilters;

export type GraphQLAttributeFilters = StringFilters | NumberFilters;

export type StringFilters = LogicalOperation<{
    equals?: string;
    in?: string[];
    matches?: string;
    contains?: string;
    startsWith?: string;
    endsWith?: string;
}>;

export type NumberFilters = LogicalOperation<{
    equals?: string;
    in?: string[];
    lt?: string;
    lte?: string;
    gt?: string;
    gte?: string;
}>;

export type RelationshipFilters = {
    edges?: {
        some?: GraphQLEdgeWhere;
        single?: GraphQLEdgeWhere;
        all?: GraphQLEdgeWhere;
        none?: GraphQLEdgeWhere;
    };
};

type LogicalOperation<T> = {
    AND?: Array<LogicalOperation<T>>;
    OR?: Array<LogicalOperation<T>>;
    NOT?: LogicalOperation<T>;
} & T;
