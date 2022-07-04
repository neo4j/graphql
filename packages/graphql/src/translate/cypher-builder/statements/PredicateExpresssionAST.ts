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

import { CypherContext } from "../CypherContext";
import { CypherParameter, CypherVariable } from "../references/References";
import { Query } from "./Query";
import { ScalarFunction } from "./scalar-functions";


export type Expression  = PropertyExpression | ScalarFunction | LiteralExpression | ParamExpression;

export class PropertyExpression {
    property: any;
    target: CypherVariable;
    constructor(target: CypherVariable, property: any) {
        this.property = property;
        this.target = target;
    }

    getCypher(cypherContext: CypherContext): string {
        const varId = cypherContext.getVariableId(this.target);
        return `${varId}.${this.property}`;
    }
}

export class LiteralExpression {
    value: any;
    constructor(value: any) {
        this.value = value;
    }

    getCypher(cypherContext: CypherContext): string {
        if (this.value === null) {
            return `NULL`;
        }
        return `${this.value}`;
    }
}

export class ParamExpression {
    param: CypherParameter;
    constructor(param: CypherParameter) {
        this.param = param;
    }

    getCypher(cypherContext: CypherContext): string {
        const paramId = cypherContext.getParamId(this.param);
        return `$${paramId}`

    }
}

export interface EqualityComparator {
    eq: (left, right) => string;
}

export interface NumericalComparator extends EqualityComparator {
    lt: (left, right) => string;
    lte: (left, right) => string;
    gt: (left, right) => string;
    gte: (left, right) => string;
}

// Str just ot avoid a collision
export interface StrComparator extends EqualityComparator {
    contains: (left, right) => string;
    startsWith: (left, right) => string;
    endsWith: (left, right) => string;
    matches: (left, right) => string;
}

export interface ListComparator {
    in: (left, right) => string;
    includes: (left, right) => string;
}

export abstract class Comparator extends Query {
}

export class PointComparatorAST extends Comparator implements NumericalComparator, ListComparator {
    expression1: Expression;
    expression2: Expression;
    operation: any;
    isArray: boolean;

    constructor(
        expression1: Expression, 
        expression2: Expression, 
        operation: keyof NumericalComparator | ListComparator,
        isArray: boolean,
        parent?: Query
    ) {
        super(parent);
        this.expression1 = expression1;
        this.expression2 = expression2;
        this.operation = operation;
        this.isArray = isArray;
    }

    cypher(context: CypherContext) {
        const expression1Str = this.expression1.getCypher(context);
        const expression2Str = this.expression2.getCypher(context);
        if (expression2Str === "NULL") {
            return `${expression1Str} IS ${expression2Str}`
        }
        return this[this.operation](expression1Str, expression2Str);
    }

    static distanceTemplate(property, param, comparator) {
        return `distance(${property}, point(${param}.point)) ${comparator} ${param}.distance`;
    }

    static areaTemplate(point, points) {
        return `${point} IN ${points}`;
    }

    static paramPoint(param) {
        return `point(${param})`;
    }

    static paramPointArray(param) {
        return `[p in ${param} | point(p)]`;
    }

    lt(left, right) {
        return PointComparatorAST.distanceTemplate(left, right, "<");
    }
    
    lte(left, right) {
        return PointComparatorAST.distanceTemplate(left, right, "<=");
    }

    gt(left, right) {
        return PointComparatorAST.distanceTemplate(left, right, ">")
    }

    gte(left, right) {
        return PointComparatorAST.distanceTemplate(left, right, ">=")
    }

    in(left, right) {
        return PointComparatorAST.areaTemplate(left, PointComparatorAST.paramPointArray(right));
    }

    includes(left, right) {
        return PointComparatorAST.areaTemplate(PointComparatorAST.paramPoint(right), left);
    }

    eq(left, right) {
        return `${left} = ${this.isArray ? PointComparatorAST.paramPointArray(right): PointComparatorAST.paramPoint(right)}`;
    }
}

export class NumbericalComparatorAST extends Comparator implements NumericalComparator, ListComparator {
    expression1: Expression;
    expression2: Expression;
    operation: any;

    constructor(
        expression1: Expression, 
        expression2: Expression, 
        operation: keyof NumericalComparator | ListComparator,
        parent?: Query
    ) {
        super(parent);
        this.expression1 = expression1;
        this.expression2 = expression2;
        this.operation = operation;
    }

    cypher(context: CypherContext) {
        const expression1Str = this.expression1.getCypher(context);
        const expression2Str = this.expression2.getCypher(context);
        if (expression2Str === "NULL") {
            return `${expression1Str} IS ${expression2Str}`;
        }
        return this[this.operation](expression1Str, expression2Str);
    }

    static numericalTemplate(left, right, operation) {
        return `${left} ${operation} ${right}`;
    }

    lt(left, right) {
        return NumbericalComparatorAST.numericalTemplate(left, right, "<");
    }
    
    lte(left, right) {
        return NumbericalComparatorAST.numericalTemplate(left, right, "<=");
    }

    gt(left, right) {
        return NumbericalComparatorAST.numericalTemplate(left, right, ">")
    }

    gte(left, right) {
        return NumbericalComparatorAST.numericalTemplate(left, right, ">=")
    }

    in(left, right) {
        return NumbericalComparatorAST.numericalTemplate(left, right, "IN");
    }

    includes(left, right) {
        return NumbericalComparatorAST.numericalTemplate(right, left, "IN");;
    }

    eq(left, right) {
        return NumbericalComparatorAST.numericalTemplate(left, right, "=");
    }
}

export class DurationComparatorAST extends Comparator implements NumericalComparator {
    expression1: Expression;
    expression2: Expression;
    operation: any;

    constructor(
        expression1: Expression, 
        expression2: Expression, 
        operation: keyof NumericalComparator,
        parent?: Query
    ) {
        super(parent);
        this.expression1 = expression1;
        this.expression2 = expression2;
        this.operation = operation;
    }

    cypher(context: CypherContext) {
        const expression1Str = this.expression1.getCypher(context);
        const expression2Str = this.expression2.getCypher(context);
        if (expression2Str === "NULL") {
            return `${expression1Str} IS ${expression2Str}`;
        }
        return this[this.operation](expression1Str, expression2Str);
    }

    private static durationTemplate(left, right, operation) {
        return `datetime() + ${left} ${operation} datetime() + ${right}`
    }

    lt(left, right) {
        return DurationComparatorAST.durationTemplate(left, right, "<");
    }
    
    lte(left, right) {
        return DurationComparatorAST.durationTemplate(left, right, "<=");
    }

    gt(left, right) {
        return DurationComparatorAST.durationTemplate(left, right, ">");
    }

    gte(left, right) {
        return DurationComparatorAST.durationTemplate(left, right, ">=");
    }

    eq(left, right) {
        return `${left} = ${right}`;
    }
}

export class TemporalComparatorAST extends Comparator implements NumericalComparator, ListComparator {
    expression1: Expression;
    expression2: Expression;
    operation: any;

    constructor(
        expression1: Expression, 
        expression2: Expression, 
        operation: keyof NumericalComparator | ListComparator,
        parent?: Query
    ) {
        super(parent);
        this.expression1 = expression1;
        this.expression2 = expression2;
        this.operation = operation;
    }

    cypher(context: CypherContext) {
        const expression1Str = this.expression1.getCypher(context);
        const expression2Str = this.expression2.getCypher(context);
        if (expression2Str === "NULL") {
            return `${expression1Str} IS ${expression2Str}`;
        }
        return this[this.operation](expression1Str, expression2Str);
    }

    private static temporalTemplate(left, right, operation) {
        return `${left} ${operation} ${right}`
    }

    lt(left, right) {
        return TemporalComparatorAST.temporalTemplate(left, right, "<");
    }
    
    lte(left, right) {
        return TemporalComparatorAST.temporalTemplate(left, right, "<=");
    }

    gt(left, right) {
        return TemporalComparatorAST.temporalTemplate(left, right, ">");
    }

    gte(left, right) {
        return TemporalComparatorAST.temporalTemplate(left, right, ">=");
    }

    in(left, right) {
        return TemporalComparatorAST.temporalTemplate(left, right, "in");
    }

    includes(left, right) {
        return TemporalComparatorAST.temporalTemplate(right, left, "in");
    }

    eq(left, right) {
        return `${left} = ${right}`;
    }
}

export class StringComparatorAST extends Comparator implements StrComparator, ListComparator {
    expression1: Expression;
    expression2: Expression;
    operation: any;

    constructor(
        expression1: Expression, 
        expression2: Expression, 
        operation: keyof StrComparator | ListComparator,
        parent?: Query
    ) {
        super(parent);
        this.expression1 = expression1;
        this.expression2 = expression2;
        this.operation = operation;
    }

    cypher(context: CypherContext) {
        const expression1Str = this.expression1.getCypher(context);
        const expression2Str = this.expression2.getCypher(context);
        if (expression2Str === "NULL") {
            return `${expression1Str} IS ${expression2Str}`;
        }
        return this[this.operation](expression1Str, expression2Str);
    }

    private static stringTemplate(left, right, operation) {
        return `${left} ${operation} ${right}`
    }

    startsWith(left, right) {
        return StringComparatorAST.stringTemplate(left, right, "STARTS WITH");
    }

    endsWith(left, right) {
        return StringComparatorAST.stringTemplate(left, right, "ENDS WITH");
    }

    contains(left, right) {
        return StringComparatorAST.stringTemplate(left, right, "CONTAINS");
    }

    eq(left, right) {
        return StringComparatorAST.stringTemplate(left, right, "=");
    }

    in(left, right) {
        return StringComparatorAST.stringTemplate(left, right, "IN");
    }

    matches(left, right) {
        return StringComparatorAST.stringTemplate(left, right, "=~");
    }

    includes(left, right) {
        return StringComparatorAST.stringTemplate(right, left, "INCLUDES");
    }
}

export class BooleanComparatorAST extends Comparator implements EqualityComparator, ListComparator {
    expression1: Expression;
    expression2: Expression;
    operation: any;

    constructor(
        expression1: Expression, 
        expression2: Expression, 
        operation: keyof StrComparator | ListComparator,
        parent?: Query
    ) {
        super(parent);
        this.expression1 = expression1;
        this.expression2 = expression2;
        this.operation = operation;
    }

    cypher(context: CypherContext) {
        const expression1Str = this.expression1.getCypher(context);
        const expression2Str = this.expression2.getCypher(context);
        if (expression2Str === "NULL") {
            return `${expression1Str} IS ${expression2Str}`;
        }
        return this[this.operation](expression1Str, expression2Str);
    }

    private static booleanTemplate(left, right, operation) {
        return `${left} ${operation} ${right}`
    }

    eq(left, right) {
        return BooleanComparatorAST.booleanTemplate(left, right, "=");
    }

    in(left, right) {
        return BooleanComparatorAST.booleanTemplate(left, right, "IN");
    }

    includes(left, right) {
        return BooleanComparatorAST.booleanTemplate(right, left, "IN");
    }
}

