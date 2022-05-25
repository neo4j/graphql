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

import mapToDbProperty from "../../utils/map-to-db-property";
import { GraphElement } from "../../classes";

/** Maps Neo4jGraphQL Math operator to Cypher symbol */
const CypherOperatorMap = new Map<string, string>([
    ["_ADD", "+"],
    ["_SUBTRACT", "-"],
    ["_MULTIPLY", "*"],
    ["_DIVIDE", "/"],
    ["_INCREMENT", "+"],
    ["_DECREMENT", "-"]
]);

function mathOperatorToSymbol(mathOperator: string): string {
    if (CypherOperatorMap.has(mathOperator)) {
        return CypherOperatorMap.get(mathOperator) as string;
    }
    throw new Error(`${mathOperator} is not a valid math operator`);
}

export const MATH_FIELD_REGX = /(?<propertyName>\w*)(?<operatorName>_INCREMENT|_DECREMENT|_ADD|_SUBTRACT|_DIVIDE|_MULTIPLY)\b/;

interface MathDescriptor {
    dbName: string;
    graphQLType: string;
    fieldName: string;
    operationName: string;
    operationSymbol: string;
    value: number;
}

interface MathMatch {
    isMatched: boolean;
    operatorName: string;
    propertyName: string;
}
// Returns True in case of a valid match and the potential match. 
export function matchMathField(graphQLFieldName: string): MathMatch {
    const mathFieldMatch = graphQLFieldName.match(MATH_FIELD_REGX);
    if (mathFieldMatch && mathFieldMatch.groups) {
        const operatorName = mathFieldMatch.groups.operatorName;
        const propertyName = mathFieldMatch.groups.propertyName;
        const isMatched = Boolean(mathFieldMatch && mathFieldMatch.length > 2 && operatorName && propertyName);
        return {
            isMatched,
            operatorName,
            propertyName
        }
    } 
    return {
        isMatched: false,
        operatorName: "",
        propertyName: ""
    }
}

export function mathDescriptorBuilder(value: number, entity: GraphElement, graphQLFieldName?: string, fieldMatch?: MathMatch): MathDescriptor {
    if (!fieldMatch && !graphQLFieldName) {
        throw new Error('mathDescriptorBuilder need to be invoked with graphQLFieldName or fieldMatch');
    }
    let match: MathMatch;
    if (!fieldMatch) {
        const mathMatch = matchMathField(graphQLFieldName as string);
        const {isMatched} = mathMatch;

        if (!isMatched) {
            throw new Error(`GraphQL field ${graphQLFieldName} is not a valid Math Field`);
        }
        match = mathMatch;
    } else {
        match = fieldMatch;
    }
    const fieldName = match.propertyName;
    const field = entity.primitiveFields.find((x) => x.fieldName === fieldName);
    if (!field) {
        throw new Error(`${fieldName} is not settable`);
    }
    return {
        dbName: mapToDbProperty(entity, fieldName) as string,
        graphQLType: field.typeMeta.name,
        fieldName,
        operationName: match.operatorName,
        operationSymbol: mathOperatorToSymbol(match.operatorName as string),
        value
    };
}

export function buildMathStatements(mathDescriptor: MathDescriptor, scope: string, param: string): Array<string> {
    if (mathDescriptor.operationSymbol === "/" && mathDescriptor.value === 0) {
        throw new Error('Division by zero is not supported');
    }
    const statements: string[] = [];
    // Raise for operations with NAN
    statements.push(`WITH ${scope} CALL apoc.util.validate(apoc.meta.type(${scope}.${mathDescriptor.dbName}) = "NULL", 'Cannot %s %s to Nan', ["${mathDescriptor.operationName}", $${param}])`);
    const bitSize = mathDescriptor.graphQLType === "Int" ? 32 : 64;
    // Avoid overflows, for 64 bit overflows, a long overflow is raised anyway by Neo4j
    statements.push(`WITH ${scope} CALL apoc.util.validate(${scope}.${mathDescriptor.dbName} ${mathDescriptor.operationSymbol} $${param} > 2^${bitSize-1}-1, 'Value returned from operator %s is larger than %s bit', ["${mathDescriptor.operationName}", "${bitSize}"])`);
    const cyperType = mathDescriptor.graphQLType === "Int" || mathDescriptor.graphQLType === "BigInt" ? "INTEGER" : "FLOAT";
    // Avoid type coercion
    statements.push(`WITH ${scope} CALL apoc.util.validate(apoc.meta.type(${scope}.${mathDescriptor.dbName} ${mathDescriptor.operationSymbol} $${param}) <> "${cyperType}", 'Value returned from operator %s does not match: %s', ["${mathDescriptor.operationName}", "${mathDescriptor.graphQLType}"])`);
    statements.push(`SET ${scope}.${mathDescriptor.dbName} = ${scope}.${mathDescriptor.dbName} ${mathDescriptor.operationSymbol} $${param}`);
    return statements;
}
