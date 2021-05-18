import Relationship from "../../classes/Relationship";
import { GraphQLWhereArg, Context, PrimitiveField } from "../../types";
import createFilter from "./create-filter";

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
}: {
    whereInput: GraphQLWhereArg;
    context: Context;
    relationship: Relationship;
    relationshipVariable: string;
    parameterPrefix: string;
}): [string, any] {
    if (!Object.keys(whereInput).length) {
        return ["", {}];
    }

    function reducer(res: Res, [key, value]: [string, GraphQLWhereArg]): Res {
        const param = `${parameterPrefix}.${key}`;

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
                    context,
                    parameterPrefix: `${parameterPrefix}.${fieldName}[${i}]`,
                });

                innerClauses.push(`(${recurse[0]})`);
                nestedParams.push(recurse[1]);
            });

            res.clauses.push(`(${innerClauses.join(` ${fieldName} `)})`);
            res.params = { ...res.params, [fieldName]: nestedParams };

            return res;
        }

        // Equality/inequality
        if (!operator) {
            if (value === null) {
                res.clauses.push(not ? `${property} IS NOT NULL` : `${property} IS NULL`);
                return res;
            }

            if (pointField) {
                if (pointField.typeMeta.array) {
                    let clause = `${property} = [p in $${param} | point(p)]`;
                    if (not) clause = `(NOT ${clause})`;
                    res.clauses.push(clause);
                } else {
                    let clause = `${property} = point($${param})`;
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
            const clause = createFilter({
                left: property,
                operator,
                right: pointField ? `[p in $${param} | point(p)]` : `$${param}`,
                not,
            });
            res.clauses.push(clause);
            res.params[key] = value;

            return res;
        }

        if (operator === "INCLUDES") {
            const clause = createFilter({
                left: pointField ? `point($${param})` : `$${param}`,
                operator,
                right: property,
                not,
            });
            res.clauses.push(clause);
            res.params[key] = value;

            return res;
        }

        if (operator && ["MATCHES", "CONTAINS", "STARTS_WITH", "ENDS_WITH"].includes(operator)) {
            const clause = createFilter({
                left: property,
                operator,
                right: `$${param}`,
                not,
            });
            res.clauses.push(clause);
            res.params[key] = value;
            return res;
        }

        if (operator && ["DISTANCE", "LT", "LTE", "GTE", "GT"].includes(operator)) {
            const clause = createFilter({
                left: pointField ? `distance(${property}, point($${param}.point))` : property,
                operator,
                right: pointField ? `$${param}.distance` : `$${param}`,
            });
            res.clauses.push(clause);
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
