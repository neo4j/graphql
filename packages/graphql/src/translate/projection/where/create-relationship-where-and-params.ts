import Relationship from "../../../classes/Relationship";
import { GraphQLWhereArg, Context, PrimitiveField } from "../../../types";

interface Res {
    clauses: string[];
    params: any;
}

function createRelationshipWhereAndParams({
    whereInput,
    context,
    relationship,
    relationshipVariable,
    parameterPrefix,
}: // chainStr,
{
    whereInput: GraphQLWhereArg;
    context: Context;
    relationship: Relationship;
    relationshipVariable: string;
    parameterPrefix: string;
    // authValidateStrs?: string[];
    // chainStr?: string;
}): [string, any] {
    if (!Object.keys(whereInput).length) {
        return ["", {}];
    }

    function reducer(res: Res, [key, value]: [string, GraphQLWhereArg]): Res {
        const param = `${parameterPrefix}.${key}`;

        const operators = {
            INCLUDES: "IN",
            IN: "IN",
            MATCHES: "=~",
            CONTAINS: "CONTAINS",
            STARTS_WITH: "STARTS WITH",
            ENDS_WITH: "ENDS WITH",
            LT: "<",
            GT: ">",
            GTE: ">=",
            LTE: "<=",
            DISTANCE: "=",
        };

        const re = /(?<field>[_A-Za-z][_0-9A-Za-z]*?)(?:_(?<not>NOT))?(?:_(?<operator>INCLUDES|IN|MATCHES|CONTAINS|STARTS_WITH|ENDS_WITH|LT|GT|GTE|LTE|DISTANCE))?$/gm;

        const match = re.exec(key);

        const fieldName = match?.groups?.field;
        const not = !!match?.groups?.not;
        const operator = match?.groups?.operator;

        const pointField = relationship.fields.find(
            (f) => f.fieldName === fieldName && ["Point", "CartesianPoint"].includes(f.typeMeta.name)
        );

        const coalesceValue = (relationship.fields.find(
            (f) => f.fieldName === fieldName && "coalesce" in f
        ) as PrimitiveField)?.coalesceValue;

        const property =
            coalesceValue !== undefined
                ? `coalesce(${relationshipVariable}.${fieldName}, ${coalesceValue})`
                : `${relationshipVariable}.${fieldName}`;

        if (fieldName && ["AND", "OR"].includes(fieldName)) {
            const innerClauses: string[] = [];
            const nestedParams: any[] = [];

            value.forEach((v: any, i) => {
                const recurse = createRelationshipWhereAndParams({
                    whereInput: v,
                    relationship,
                    relationshipVariable,
                    // chainStr: `${param}${i > 0 ? i : ""}`,
                    context,
                    // recursing: true,
                    parameterPrefix: `${parameterPrefix}.${fieldName}[${i}]`,
                });

                innerClauses.push(`(${recurse[0]})`);
                // res.params = { ...res.params, ...recurse[1] };
                nestedParams.push(recurse[1]);
            });

            res.clauses.push(`(${innerClauses.join(` ${fieldName} `)})`);
            res.params = { ...res.params, [fieldName]: nestedParams };

            return res;
        }

        // Equality/inequality
        if (!operator) {
            if (value === null) {
                res.clauses.push(
                    not
                        ? `${relationshipVariable}.${fieldName} IS NOT NULL`
                        : `${relationshipVariable}.${fieldName} IS NULL`
                );
                return res;
            }

            if (pointField) {
                if (pointField.typeMeta.array) {
                    let clause = `${relationshipVariable}.${fieldName} = [p in $${param} | point(p)]`;
                    if (not) clause = `(NOT ${clause})`;
                    res.clauses.push(clause);
                } else {
                    let clause = `${relationshipVariable}.${fieldName} = point($${param})`;
                    if (not) clause = `(NOT ${clause})`;
                    res.clauses.push(clause);
                }
            } else {
                let clause = `${property} = $${param}`;
                if (not) clause = `(NOT ${clause})`;
                res.clauses.push(clause);
            }

            res.params[key] = value;
            return res;
        }

        if (operator === "IN") {
            if (pointField) {
                let clause = `${relationshipVariable}.${fieldName} IN [p in $${param} | point(p)]`;
                if (not) clause = `(NOT ${clause})`;
                res.clauses.push(clause);
                res.params[key] = value;
            } else {
                let clause = `${property} IN $${param}`;
                if (not) clause = `(NOT ${clause})`;
                res.clauses.push(clause);
                res.params[key] = value;
            }

            return res;
        }

        if (operator === "INCLUDES") {
            let clause = pointField
                ? `point($${param}) IN ${relationshipVariable}.${fieldName}`
                : `$${param} IN ${property}`;

            if (not) clause = `(NOT ${clause})`;

            res.clauses.push(clause);
            res.params[key] = value;

            return res;
        }

        if (key.endsWith("_MATCHES")) {
            res.clauses.push(`${property} =~ $${param}`);
            res.params[key] = value;

            return res;
        }

        if (operator && ["CONTAINS", "STARTS_WITH", "ENDS_WITH"].includes(operator)) {
            let clause = `${property} ${operators[operator]} $${param}`;
            if (not) clause = `(NOT ${clause})`;
            res.clauses.push(clause);
            res.params[key] = value;
            return res;
        }

        if (operator && ["LT", "LTE", "GTE", "GT"].includes(operator)) {
            res.clauses.push(
                pointField
                    ? `distance(${relationshipVariable}.${fieldName}, point($${param}.point)) ${operators[operator]} $${param}.distance`
                    : `${property} ${operators[operator]} $${param}`
            );
            res.params[key] = value;
            return res;
        }

        if (key.endsWith("_DISTANCE")) {
            res.clauses.push(
                `distance(${relationshipVariable}.${fieldName}, point($${param}.point)) = $${param}.distance`
            );
            res.params[key] = value;

            return res;
        }

        // Necessary for TypeScript, but should never reach here
        return res;
    }

    const { clauses, params } = Object.entries(whereInput).reduce(reducer, { clauses: [], params: {} });
    // let where = `${!recursing ? "WHERE " : ""}`;
    const where = clauses.join(" AND ").replace(/INNER_WHERE/gi, "WHERE");

    return [where, params];
}

export default createRelationshipWhereAndParams;
