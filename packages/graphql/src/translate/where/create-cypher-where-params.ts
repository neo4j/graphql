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

import type { GraphQLWhereArg, Context } from "../../types";
import type { GraphElement } from "../../classes";
import * as CypherBuilder from "../cypher-builder/CypherBuilder";
import { filterTruthy } from "../../utils/utils";
// Recursive function
// eslint-disable-next-line import/no-cycle
import { createWherePropertyOperation } from "./property-operations/create-where-property-operation";

/** Translate a target node and GraphQL input into a Cypher operation o valid where expression */
export function createCypherWhereParams({
    targetElement,
    whereInput,
    context,
    element,
}: {
    targetElement: CypherBuilder.Variable;
    whereInput: GraphQLWhereArg;
    context: Context;
    element: GraphElement;
}): CypherBuilder.WhereParams | undefined {
    const mappedProperties = mapPropertiesToOperators({
        whereInput,
        targetElement,
        element,
        context,
    });

    // Implicit AND
    return CypherBuilder.and(...mappedProperties);
}

function mapPropertiesToOperators({
    whereInput,
    element,
    targetElement,
    context,
}: {
    whereInput: GraphQLWhereArg;
    element: GraphElement;
    targetElement: CypherBuilder.Variable;
    context: Context;
}): Array<CypherBuilder.ComparisonOp | CypherBuilder.BooleanOp | CypherBuilder.RawCypher | CypherBuilder.Exists> {
    const whereFields = Object.entries(whereInput);

    return filterTruthy(
        whereFields.map(([key, value]): CypherBuilder.WhereParams | undefined => {
            if (key === "OR") {
                const nested = mapBooleanPropertiesToOperators({ value, element, targetElement, context });
                return CypherBuilder.or(...nested);
            }
            if (key === "AND") {
                const nested = mapBooleanPropertiesToOperators({ value, element, targetElement, context });
                return CypherBuilder.and(...nested);
            }
            return createWherePropertyOperation({ key, value, element, targetElement, context });
        })
    );
}

function mapBooleanPropertiesToOperators({
    value,
    element,
    targetElement,
    context,
}: {
    value: Array<any>;
    element: GraphElement;
    targetElement: CypherBuilder.Variable;
    context: Context;
}): Array<CypherBuilder.ComparisonOp | CypherBuilder.BooleanOp | CypherBuilder.RawCypher | CypherBuilder.Exists> {
    const nestedOperations = value.map((v) => {
        return createCypherWhereParams({ whereInput: v, element, targetElement, context });
    });

    return filterTruthy(nestedOperations);
}
