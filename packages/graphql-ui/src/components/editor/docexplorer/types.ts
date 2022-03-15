import { MouseEvent } from "react";
// eslint-disable-next-line import/no-extraneous-dependencies
import {
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
    event?: MouseEvent
) => void;

export type OnClickTypeFunction = (type: GraphQLNamedType, event?: MouseEvent<HTMLAnchorElement>) => void;

export type OnClickFieldOrTypeFunction = OnClickFieldFunction | OnClickTypeFunction;

export type Maybe<T> = T | null | undefined;
