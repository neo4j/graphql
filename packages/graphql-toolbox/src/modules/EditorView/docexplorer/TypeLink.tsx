/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import type { GraphQLType, GraphQLNamedType } from "graphql";
import { GraphQLList, GraphQLNonNull } from "graphql";
import { Fragment } from "react";
import type { OnClickTypeFunction, Maybe } from "./types";

type TypeLinkProps = {
    type?: Maybe<GraphQLType>;
    onClick?: OnClickTypeFunction;
};

export default function TypeLink(props: TypeLinkProps) {
    const onClick = props.onClick ? props.onClick : () => null;
    return renderType(props.type, onClick);
}

function renderType(type: Maybe<GraphQLType>, onClick: OnClickTypeFunction) {
    if (type instanceof GraphQLNonNull) {
        return (
            <span>
                {renderType(type.ofType, onClick)}
                {"!"}
            </span>
        );
    }
    if (type instanceof GraphQLList) {
        return (
            <span>
                {"["}
                {renderType(type.ofType, onClick)}
                {"]"}
            </span>
        );
    }
    return (
        <Fragment>
            {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
            <a
                className="type-name"
                onClick={(event) => {
                    event.preventDefault();
                    onClick(type as GraphQLNamedType, event);
                }}
                href="#"
            >
                {type?.name}
            </a>
        </Fragment>
    );
}
