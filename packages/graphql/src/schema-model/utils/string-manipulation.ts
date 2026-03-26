/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import camelcase from "camelcase";
import pluralize from "pluralize";
import { leadingUnderscores } from "../../utils/leading-underscore";

export function singular(name: string): string {
    const singular = camelcase(name);
    return `${leadingUnderscores(name)}${singular}`;
}


export function plural(name: string): string {
    const plural = pluralize(camelcase(name));
    return `${leadingUnderscores(name)}${plural}`;
}
