import { GraphQLWhereArg } from "../types";
import { Context, Node } from "../classes";

interface Res {
    clauses: string[];
    params: any;
}

function createWhereAndParams({
    whereInput,
    varName,
    chainStr,
    node,
    context,
    recursing,
}: {
    node: Node;
    context: Context;
    whereInput: GraphQLWhereArg;
    varName: string;
    chainStr?: string;
    recursing?: boolean;
}): [string, any] {
    if (!Object.keys(whereInput).length) {
        return ["", {}];
    }

    function reducer(res: Res, [key, value]: [string, GraphQLWhereArg]): Res {
        let param = "";
        if (chainStr) {
            param = `${chainStr}_${key}`;
        } else {
            param = `${varName}_${key}`;
        }

        const [fieldName, ...rest] = key.split("_");
        const operator = rest.join("_");
        const relationField = node.relationFields.find((x) => fieldName === x.fieldName);
        const valueIsObject = Boolean(!Array.isArray(value) && Object.keys(value).length && typeof value !== "string");

        if (valueIsObject && !relationField) {
            const recurse = createWhereAndParams({ whereInput: value, varName, chainStr, node, context, recursing });
            res.clauses.push(`(${recurse[0]})`);
            res.params = { ...res.params, ...recurse[1] };

            return res;
        }

        if (relationField) {
            const refNode = context.neoSchema.nodes.find((x) => x.name === relationField.typeMeta.name) as Node;
            const inStr = relationField.direction === "IN" ? "<-" : "-";
            const outStr = relationField.direction === "OUT" ? "->" : "-";
            const relTypeStr = `[:${relationField.type}]`;

            switch (operator) {
                case "NOT":
                    {
                        let resultStr = [
                            `EXISTS((${varName})${inStr}${relTypeStr}${outStr}(:${relationField.typeMeta.name}))`,
                            `AND NONE(${param} IN [(${varName})${inStr}${relTypeStr}${outStr}(${param}:${relationField.typeMeta.name}) | ${param}] INNER_WHERE `,
                        ].join(" ");

                        const recurse = createWhereAndParams({
                            whereInput: value,
                            varName: param,
                            chainStr: param,
                            node: refNode,
                            context,
                            recursing: true,
                        });

                        resultStr += recurse[0];
                        resultStr += ")"; // close ALL
                        res.clauses.push(resultStr);
                        res.params = { ...res.params, ...recurse[1] };
                    }
                    break;

                case "IN":
                    {
                        let resultStr = [
                            `EXISTS((${varName})${inStr}${relTypeStr}${outStr}(:${relationField.typeMeta.name}))`,
                            `AND ALL(${param} IN [(${varName})${inStr}${relTypeStr}${outStr}(${param}:${relationField.typeMeta.name}) | ${param}] INNER_WHERE `,
                        ].join(" ");

                        const inner: string[] = [];

                        (value as any[]).forEach((v, i) => {
                            const recurse = createWhereAndParams({
                                whereInput: v,
                                varName: param,
                                chainStr: `${param}${i}`,
                                node: refNode,
                                context,
                                recursing: true,
                            });

                            inner.push(recurse[0]);
                            res.params = { ...res.params, ...recurse[1] };
                        });

                        resultStr += inner.join(" OR ");
                        resultStr += ")"; // close ALL
                        res.clauses.push(resultStr);
                    }
                    break;

                // equality
                default: {
                    let resultStr = [
                        `EXISTS((${varName})${inStr}${relTypeStr}${outStr}(:${relationField.typeMeta.name}))`,
                        `AND ALL(${param} IN [(${varName})${inStr}${relTypeStr}${outStr}(${param}:${relationField.typeMeta.name}) | ${param}] INNER_WHERE `,
                    ].join(" ");

                    const recurse = createWhereAndParams({
                        whereInput: value,
                        varName: param,
                        chainStr: param,
                        node: refNode,
                        context,
                        recursing: true,
                    });

                    resultStr += recurse[0];
                    resultStr += ")"; // close ALL
                    res.clauses.push(resultStr);
                    res.params = { ...res.params, ...recurse[1] };
                }
            }

            return res;
        }

        switch (operator) {
            case "IN":
                res.clauses.push(`${varName}.${fieldName} IN $${param}`);
                res.params[param] = value;
                break;

            case "NOT":
                res.clauses.push(`(NOT ${varName}.${fieldName} = $${param})`);
                res.params[param] = value;
                break;

            case "NOT_IN":
                res.clauses.push(`(NOT ${varName}.${fieldName} IN $${param})`);
                res.params[param] = value;
                break;

            case "CONTAINS":
                res.clauses.push(`${varName}.${fieldName} CONTAINS $${param}`);
                res.params[param] = value;
                break;

            case "NOT_CONTAINS":
                res.clauses.push(`(NOT ${varName}.${fieldName} CONTAINS $${param})`);
                res.params[param] = value;
                break;

            case "STARTS_WITH":
                res.clauses.push(`${varName}.${fieldName} STARTS WITH $${param}`);
                res.params[param] = value;
                break;

            case "NOT_STARTS_WITH":
                res.clauses.push(`(NOT ${varName}.${fieldName} STARTS WITH $${param})`);
                res.params[param] = value;
                break;

            case "ENDS_WITH":
                res.clauses.push(`${varName}.${fieldName} ENDS WITH $${param}`);
                res.params[param] = value;
                break;

            case "NOT_ENDS_WITH":
                res.clauses.push(`(NOT ${varName}.${fieldName} ENDS WITH $${param})`);
                res.params[param] = value;
                break;

            case "LT":
                res.clauses.push(`${varName}.${fieldName} < $${param}`);
                res.params[param] = value;
                break;

            case "LTE":
                res.clauses.push(`${varName}.${fieldName} <= $${param}`);
                res.params[param] = value;
                break;

            case "GT":
                res.clauses.push(`${varName}.${fieldName} > $${param}`);
                res.params[param] = value;
                break;

            case "GTE":
                res.clauses.push(`${varName}.${fieldName} >= $${param}`);
                res.params[param] = value;
                break;

            default:
                switch (fieldName) {
                    case "AND":
                    case "OR":
                        {
                            const innerClauses: string[] = [];

                            value.forEach((v: any, i) => {
                                const recurse = createWhereAndParams({
                                    whereInput: v,
                                    varName,
                                    chainStr: `${param}${i > 0 ? i : ""}`,
                                    node,
                                    context,
                                    recursing: true,
                                });

                                innerClauses.push(`${recurse[0]}`);
                                res.params = { ...res.params, ...recurse[1] };
                            });

                            res.clauses.push(`(${innerClauses.join(` ${fieldName} `)})`);
                        }
                        break;

                    default: {
                        res.clauses.push(`${varName}.${fieldName} = $${param}`);
                        res.params[param] = value;
                    }
                }
        }

        return res;
    }

    const { clauses, params } = Object.entries(whereInput).reduce(reducer, { clauses: [], params: {} });
    let where = `${!recursing ? "WHERE " : ""}`;
    where += clauses.join(" AND ").replace(/INNER_WHERE/gi, "WHERE");

    return [where, params];
}

export default createWhereAndParams;
