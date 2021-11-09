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

const map = {
    // Primitives
    Long: "Int",
    Float: "Float",
    Double: "Float",
    Integer: "Int",
    String: "String",
    Boolean: "Boolean",
    Date: "Date",
    DateTime: "DateTime",
    LocalTime: "LocalTime",
    LocalDateTime: "LocalDateTime",
    Time: "Time",
    Point: "Point",

    // Array types
    LongArray: "[Int]",
    DoubleArray: "[Float]",
    FloatArray: "[Float]",
    IntegerArray: "[Int]",
    BooleanArray: "[Boolean]",
    StringArray: "[String]",
    DateArray: "[Date]",
    DateTimeArray: "[DateTime]",
    TimeArray: "[Time]",
    LocalTimeArray: "[LocalTime]",
    LocalDateTimeArray: "[LocalDateTime]",
    PointArray: "[Point]",
};

export function mapNeo4jToGraphQLType(neo4jType: string[], mandatory?: boolean): string {
    const mandatoryStr: string = mandatory ? "!" : "";
    const graphQLType: string = map[neo4jType[0]] || "String";
    return graphQLType + mandatoryStr;
}
