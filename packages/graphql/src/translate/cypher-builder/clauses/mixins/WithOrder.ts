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

import { Order, OrderBy } from "../../sub-clauses/OrderBy";
import { ClauseMixin } from "./ClauseMixin";
import type { Expr } from "../../types";

const DEFAULT_ORDER = "ASC";

export abstract class WithOrder extends ClauseMixin {
    protected orderByStatement: OrderBy | undefined;

    public orderBy(...exprs: Array<[Expr, Order] | Expr | [Expr]>): this {
        const normalizedExprs = exprs.map((rawExpr): [Expr, Order] => {
            if (Array.isArray(rawExpr)) {
                return [rawExpr[0], rawExpr[1] || DEFAULT_ORDER];
            }
            return [rawExpr, DEFAULT_ORDER];
        });

        this.orderByStatement = new OrderBy(normalizedExprs);

        return this;
    }
}
