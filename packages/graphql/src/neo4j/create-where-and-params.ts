interface Res {
    clauses: string[];
    params: any;
}

function createWhereAndParams({
    query,
    varName,
    chainStr,
}: {
    query: any;
    varName: string;
    chainStr?: string;
}): [string, any] {
    if (!Object.keys(query).length) {
        return ["", {}];
    }

    function reducer(res: Res, [key, value]: [string, any]): Res {
        let param = "";
        if (chainStr) {
            param = `${chainStr}_${key}`;
        } else {
            param = `${varName}_${key}`;
        }

        const [fieldName, operator] = key.split("_");

        const valueIsObject = Boolean(!Array.isArray(value) && Object.keys(value).length && typeof value !== "string");
        if (valueIsObject) {
            const r = createWhereAndParams({ query: value, varName });
            res.clauses.push(`(${r[0]})`);
            res.params = { ...res.params, ...r[1] };

            return res;
        }

        switch (operator) {
            case "IN":
                res.clauses.push(`${varName}.${fieldName} IN $${param}`);
                res.params[param] = value;
                break;
            case "AND":
            case "OR":
                {
                    const innerClauses: string[] = [];

                    value.forEach((v: any, i) => {
                        const r = createWhereAndParams({
                            query: v,
                            varName,
                            chainStr: `${param}${i > 0 ? i : ""}`,
                        });

                        innerClauses.push(`${r[0]}`);
                        res.params = { ...res.params, ...r[1] };
                    });

                    res.clauses.push(`(${innerClauses.join(` ${operator} `)})`);
                }
                break;

            default:
                res.clauses.push(`${varName}.${fieldName} = $${param}`);
                res.params[param] = value;
        }

        return res;
    }

    const { clauses, params } = Object.entries(query).reduce(reducer, { clauses: [], params: {} });
    let where = `WHERE `;
    where += clauses.join(" AND ").replace(/WHERE /gi, "");

    return [where, params];
}

export default createWhereAndParams;
