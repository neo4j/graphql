import { PointField, PrimitiveField } from "../../types";

export type NumericalWhereOperator = "GT" | "GTE" | "LT" | "LTE";
export type SpatialWhereOperator = "DISTANCE";
export type StringWhereOperator = "CONTAINS" | "STARTS_WITH" | "ENDS_WITH";
export type RegexWhereOperator = "MATCHES";
export type ArrayWhereOperator = "IN" | "INCLUDES";
export type RelationshipWhereOperator = "ALL" | "NONE" | "SINGLE" | "SOME";

export type WhereOperator =
    | "NOT"
    | NumericalWhereOperator
    | SpatialWhereOperator
    | StringWhereOperator
    | `NOT_${StringWhereOperator}`
    | RegexWhereOperator
    | ArrayWhereOperator
    | `NOT_${ArrayWhereOperator}`
    | RelationshipWhereOperator;

export const comparisonMap: Record<Exclude<WhereOperator, RelationshipWhereOperator>, string> = {
    NOT: "=",
    // Numerical
    GT: ">",
    GTE: ">=",
    LT: "<",
    LTE: "<=",
    // Distance
    DISTANCE: "=",
    // String
    NOT_CONTAINS: "CONTAINS",
    CONTAINS: "CONTAINS",
    NOT_STARTS_WITH: "STARTS WITH",
    STARTS_WITH: "STARTS WITH",
    NOT_ENDS_WITH: "ENDS WITH",
    ENDS_WITH: "ENDS WITH",
    // Regex
    MATCHES: "=~",
    // Array
    NOT_IN: "IN",
    IN: "IN",
    NOT_INCLUDES: "IN",
    INCLUDES: "IN",
};

export const whereRegEx = /(?<fieldName>[_A-Za-z]\w*?)(?<isAggregate>Aggregate)?(?:_(?<operator>NOT|NOT_IN|IN|NOT_INCLUDES|INCLUDES|MATCHES|NOT_CONTAINS|CONTAINS|NOT_STARTS_WITH|STARTS_WITH|NOT_ENDS_WITH|ENDS_WITH|LT|LTE|GT|GTE|DISTANCE|ALL|NONE|SINGLE|SOME))?$/;
export type WhereRegexGroups = {
    fieldName: string;
    isAggregate?: string;
    operator?: WhereOperator;
};

export const createWhereClause = ({
    property,
    param,
    operator,
    isNot,
    durationField,
    pointField,
}: {
    property: string;
    param: string;
    operator?: WhereOperator;
    isNot: boolean;
    pointField?: PointField;
    durationField?: PrimitiveField;
}) => {
    const negateClauseIfNOT = (clause: string) => (isNot ? `(NOT ${clause})` : clause);

    if (pointField) {
        const paramPoint = `point($${param})`;
        const paramPointArray = `[p in $${param} | point(p)]`;

        switch (operator) {
            case "LT":
            case "LTE":
            case "GT":
            case "GTE":
            case "DISTANCE":
                return `distance(${property}, point($${param}.point)) ${comparisonMap[operator]} $${param}.distance`;
            case "NOT_IN":
            case "IN":
                return negateClauseIfNOT(`${property} IN ${paramPointArray}`);
            case "NOT_INCLUDES":
            case "INCLUDES":
                return negateClauseIfNOT(`${paramPoint} IN ${property}`);
            default:
                return negateClauseIfNOT(`${property} = ${pointField.typeMeta.array ? paramPointArray : paramPoint}`);
        }
    }
    // Comparison operations requires adding dates to durations
    // See https://neo4j.com/developer/cypher/dates-datetimes-durations/#comparing-filtering-values
    if (durationField && operator) {
        return `datetime() + ${property} ${comparisonMap[operator]} datetime() + $${param}`;
    }

    const comparison = operator ? comparisonMap[operator] : "=";

    switch (operator) {
        case "NOT_INCLUDES":
        case "INCLUDES":
            return negateClauseIfNOT(`$${param} ${comparison} ${property}`);
        default:
            return negateClauseIfNOT(`${property} ${comparison} $${param}`);
    }
};

type ListPredicate = "ALL" | "NONE" | "SINGLE" | "ANY";

export const getListPredicate = (operator?: WhereOperator): ListPredicate => {
    switch (operator) {
        case "ALL":
            return "ALL";
        case "NOT":
        case "NONE":
            return "NONE";
        case "SINGLE":
            return "SINGLE";
        case "SOME":
        default:
            return "ANY";
    }
};