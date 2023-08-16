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

import Cypher from "@neo4j/cypher-builder";
import dotProp from "dot-prop";
import type { Context, GraphQLWhereArg } from "../../../types";

export function populateWhereParams({ where, context }: { where: GraphQLWhereArg; context: Context }): GraphQLWhereArg {
    const parsed: GraphQLWhereArg = {};

    Object.entries(where).forEach(([k, v]) => {
        if (Array.isArray(v)) {
            parsed[k] = v.map((w) => populateWhereParams({ where: w, context }));
        } else if (v === null) {
            parsed[k] = v;
        } else if (typeof v === "object") {
            parsed[k] = populateWhereParams({ where: v, context });
        } else if (typeof v === "string") {
            parsed[k] = parseContextParamProperty(v, context);
        } else {
            parsed[k] = v;
        }
    });

    return parsed;
}

export function parseContextParamProperty(value: string, context: Context): string | Cypher.Property | Cypher.Param {
    if (value.startsWith("$jwt")) {
        const path = value.substring(5);

        const mappedPath = context.authorization.claims?.get(path) || path;

        const jwtProperty = context.authorization.jwtParam.property(...mappedPath.split("."));

        return jwtProperty;
    } else if (value.startsWith("$context")) {
        const path = value.substring(9);
        const contextValueParameter = new Cypher.Param(dotProp.get(context, path));
        return contextValueParameter;
    }

    return value;
}
