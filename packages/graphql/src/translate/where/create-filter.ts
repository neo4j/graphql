export enum Operator {
    INCLUDES = "IN",
    IN = "IN",
    MATCHES = "=~",
    CONTAINS = "CONTAINS",
    STARTS_WITH = "STARTS WITH",
    ENDS_WITH = "ENDS WITH",
    LT = "<",
    GT = ">",
    GTE = ">=",
    LTE = "<=",
    DISTANCE = "=",
}

function createFilter({
    left,
    operator,
    right,
    not,
}: {
    left: string;
    operator: string;
    right: string;
    not?: boolean;
}): string {
    if (!Operator[operator]) {
        throw new Error(`Invalid filter operator ${operator}`);
    }

    if (not && ["MATCHES", "LT", "GT", "GTE", "LTE", "DISTANCE"].includes(operator)) {
        throw new Error(`Invalid filter operator NOT_${operator}`);
    }

    let filter = `${left} ${Operator[operator]} ${right}`;
    if (not) filter = `(NOT ${filter})`;

    return filter;
}

export default createFilter;
