import { GraphQLWhereArg } from "../types";

interface Res {
    clauses: string[];
    params: any;
}

function createWhereAndParams({
    whereInput,
    varName,
    chainStr,
}: {
    whereInput: GraphQLWhereArg;
    varName: string;
    chainStr?: string;
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

        const valueIsObject = Boolean(!Array.isArray(value) && Object.keys(value).length && typeof value !== "string");
        if (valueIsObject) {
            const r = createWhereAndParams({ whereInput: value, varName, chainStr });
            res.clauses.push(`(${r[0]})`);
            res.params = { ...res.params, ...r[1] };

            return res;
        }

        const [fieldName, operator] = key.split("_");
        switch (operator) {
            case "IN":
                res.clauses.push(`${varName}.${fieldName} IN $${param}`);
                res.params[param] = value;
                break;

            default:
                switch (fieldName) {
                    case "AND":
                    case "OR":
                        {
                            const innerClauses: string[] = [];

                            value.forEach((v: any, i) => {
                                const r = createWhereAndParams({
                                    whereInput: v,
                                    varName,
                                    chainStr: `${param}${i > 0 ? i : ""}`,
                                });

                                innerClauses.push(`${r[0]}`);
                                res.params = { ...res.params, ...r[1] };
                            });

                            res.clauses.push(`(${innerClauses.join(` ${fieldName} `)})`);
                        }
                        break;

                    default:
                        res.clauses.push(`${varName}.${fieldName} = $${param}`);
                        res.params[param] = value;
                }
        }

        return res;
    }

    const { clauses, params } = Object.entries(whereInput).reduce(reducer, { clauses: [], params: {} });
    let where = `WHERE `;
    where += clauses.join(" AND ").replace(/WHERE /gi, "");

    return [where, params];
}

export default createWhereAndParams;
