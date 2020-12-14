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
    chainStrOverRide,
}: {
    node: Node;
    context: Context;
    whereInput: GraphQLWhereArg;
    varName: string;
    chainStr?: string;
    recursing?: boolean;
    chainStrOverRide?: string;
}): [string, any] {
    if (!Object.keys(whereInput).length) {
        return ["", {}];
    }

    function reducer(res: Res, [key, value]: [string, GraphQLWhereArg]): Res {
        let param = "";
        if (chainStr) {
            param = `${chainStr}_${key}`;
        } else if (chainStrOverRide) {
            param = `${chainStrOverRide}_${key}`;
        } else {
            param = `${varName}_${key}`;
        }

        if (key.endsWith("_NOT")) {
            const [fieldName] = key.split("_NOT");
            const relationField = node.relationFields.find((x) => fieldName === x.fieldName);

            if (relationField) {
                const refNode = context.neoSchema.nodes.find((x) => x.name === relationField.typeMeta.name) as Node;
                const inStr = relationField.direction === "IN" ? "<-" : "-";
                const outStr = relationField.direction === "OUT" ? "->" : "-";
                const relTypeStr = `[:${relationField.type}]`;

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
            } else {
                res.clauses.push(`(NOT ${varName}.${fieldName} = $${param})`);
                res.params[param] = value;
            }

            return res;
        }

        if (key.endsWith("_NOT_IN")) {
            const [fieldName] = key.split("_NOT_IN");
            const relationField = node.relationFields.find((x) => fieldName === x.fieldName);

            if (relationField) {
                const refNode = context.neoSchema.nodes.find((x) => x.name === relationField.typeMeta.name) as Node;
                const inStr = relationField.direction === "IN" ? "<-" : "-";
                const outStr = relationField.direction === "OUT" ? "->" : "-";
                const relTypeStr = `[:${relationField.type}]`;

                let resultStr = [
                    `EXISTS((${varName})${inStr}${relTypeStr}${outStr}(:${relationField.typeMeta.name}))`,
                    `AND ALL(${param} IN [(${varName})${inStr}${relTypeStr}${outStr}(${param}:${relationField.typeMeta.name}) | ${param}] INNER_WHERE NOT(`,
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
                resultStr += ")"; // close NOT
                resultStr += ")"; // close ALL
                res.clauses.push(resultStr);
            } else {
                res.clauses.push(`(NOT ${varName}.${fieldName} IN $${param})`);
                res.params[param] = value;
            }

            return res;
        }

        if (key.endsWith("_IN")) {
            const [fieldName] = key.split("_IN");
            const relationField = node.relationFields.find((x) => fieldName === x.fieldName);

            if (relationField) {
                const refNode = context.neoSchema.nodes.find((x) => x.name === relationField.typeMeta.name) as Node;
                const inStr = relationField.direction === "IN" ? "<-" : "-";
                const outStr = relationField.direction === "OUT" ? "->" : "-";
                const relTypeStr = `[:${relationField.type}]`;

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
            } else {
                res.clauses.push(`${varName}.${fieldName} IN $${param}`);
                res.params[param] = value;
            }

            return res;
        }

        const equalityRelation = node.relationFields.find((x) => key === x.fieldName);
        if (equalityRelation) {
            const refNode = context.neoSchema.nodes.find((x) => x.name === equalityRelation.typeMeta.name) as Node;
            const inStr = equalityRelation.direction === "IN" ? "<-" : "-";
            const outStr = equalityRelation.direction === "OUT" ? "->" : "-";
            const relTypeStr = `[:${equalityRelation.type}]`;

            let resultStr = [
                `EXISTS((${varName})${inStr}${relTypeStr}${outStr}(:${equalityRelation.typeMeta.name}))`,
                `AND ALL(${param} IN [(${varName})${inStr}${relTypeStr}${outStr}(${param}:${equalityRelation.typeMeta.name}) | ${param}] INNER_WHERE `,
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

            return res;
        }

        if (key.endsWith("_REGEX")) {
            const [fieldName] = key.split("_REGEX");
            res.clauses.push(`${varName}.${fieldName} =~ $${param}`);
            res.params[param] = value;

            return res;
        }

        if (key.endsWith("_NOT_CONTAINS")) {
            const [fieldName] = key.split("_NOT_CONTAINS");
            res.clauses.push(`(NOT ${varName}.${fieldName} CONTAINS $${param})`);
            res.params[param] = value;

            return res;
        }

        if (key.endsWith("_CONTAINS")) {
            const [fieldName] = key.split("_CONTAINS");
            res.clauses.push(`${varName}.${fieldName} CONTAINS $${param}`);
            res.params[param] = value;

            return res;
        }

        if (key.endsWith("_NOT_STARTS_WITH")) {
            const [fieldName] = key.split("_NOT_STARTS_WITH");
            res.clauses.push(`(NOT ${varName}.${fieldName} STARTS WITH $${param})`);
            res.params[param] = value;

            return res;
        }

        if (key.endsWith("_STARTS_WITH")) {
            const [fieldName] = key.split("_STARTS_WITH");
            res.clauses.push(`${varName}.${fieldName} STARTS WITH $${param}`);
            res.params[param] = value;

            return res;
        }

        if (key.endsWith("_NOT_ENDS_WITH")) {
            const [fieldName] = key.split("_NOT_ENDS_WITH");
            res.clauses.push(`(NOT ${varName}.${fieldName} ENDS WITH $${param})`);
            res.params[param] = value;

            return res;
        }

        if (key.endsWith("_ENDS_WITH")) {
            const [fieldName] = key.split("_ENDS_WITH");
            res.clauses.push(`${varName}.${fieldName} ENDS WITH $${param}`);
            res.params[param] = value;

            return res;
        }

        if (key.endsWith("_LT")) {
            const [fieldName] = key.split("_LT");
            res.clauses.push(`${varName}.${fieldName} < $${param}`);
            res.params[param] = value;

            return res;
        }

        if (key.endsWith("_LTE")) {
            const [fieldName] = key.split("_LTE");
            res.clauses.push(`${varName}.${fieldName} <= $${param}`);
            res.params[param] = value;

            return res;
        }

        if (key.endsWith("_GT")) {
            const [fieldName] = key.split("_GT");
            res.clauses.push(`${varName}.${fieldName} > $${param}`);
            res.params[param] = value;

            return res;
        }

        if (key.endsWith("_GTE")) {
            const [fieldName] = key.split("_GTE");
            res.clauses.push(`${varName}.${fieldName} >= $${param}`);
            res.params[param] = value;

            return res;
        }

        if (["AND", "OR"].includes(key)) {
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

            res.clauses.push(`(${innerClauses.join(` ${key} `)})`);

            return res;
        }

        res.clauses.push(`${varName}.${key} = $${param}`);
        res.params[param] = value;

        return res;
    }

    const { clauses, params } = Object.entries(whereInput).reduce(reducer, { clauses: [], params: {} });
    let where = `${!recursing ? "WHERE " : ""}`;
    where += clauses.join(" AND ").replace(/INNER_WHERE/gi, "WHERE");

    return [where, params];
}

export default createWhereAndParams;
