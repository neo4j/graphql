/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

const map = {
    // Primitives
    Long: "BigInt",
    Float: "Float",
    Double: "Float",
    Integer: "BigInt",
    String: "String",
    Boolean: "Boolean",
    Date: "Date",
    DateTime: "DateTime",
    LocalTime: "LocalTime",
    LocalDateTime: "LocalDateTime",
    Duration: "Duration",
    Time: "Time",
    Point: "Point",

    // Array types
    LongArray: "[BigInt!]",
    DoubleArray: "[Float!]",
    FloatArray: "[Float!]",
    IntegerArray: "[BigInt!]",
    BooleanArray: "[Boolean!]",
    StringArray: "[String!]",
    DateArray: "[Date!]",
    DateTimeArray: "[DateTime!]",
    TimeArray: "[Time!]",
    LocalTimeArray: "[LocalTime!]",
    LocalDateTimeArray: "[LocalDateTime!]",
    DurationArray: "[Duration!]",
    PointArray: "[Point!]",
};

export default function mapNeo4jToGraphQLType(neo4jType: string[], mandatory?: boolean): string {
    const mandatoryStr: string = mandatory ? "!" : "";
    const graphQLType: string = map[neo4jType[0]] || "String";
    return graphQLType + mandatoryStr;
}
