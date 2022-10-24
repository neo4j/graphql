/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import type { MouseEvent } from "react";
import type {
    GraphQLField,
    GraphQLInputField,
    GraphQLArgument,
    GraphQLObjectType,
    GraphQLInterfaceType,
    GraphQLInputObjectType,
    GraphQLType,
    GraphQLNamedType,
} from "graphql";

export type FieldType = GraphQLField<unknown, unknown, unknown> | GraphQLInputField | GraphQLArgument;

export type OnClickFieldFunction = (
    field: FieldType,
    type?: GraphQLObjectType | GraphQLInterfaceType | GraphQLInputObjectType | GraphQLType,
    event?: MouseEvent | KeyboardEvent
) => void;

export type OnClickTypeFunction = (type: GraphQLNamedType, event?: MouseEvent<HTMLAnchorElement>) => void;

export type OnClickFieldOrTypeFunction = OnClickFieldFunction | OnClickTypeFunction;

export type Maybe<T> = T | null | undefined;
