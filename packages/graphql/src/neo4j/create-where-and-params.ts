import { int } from "neo4j-driver";

function createWhereAndParams({
    query,
    varName,
    chainStr,
}: {
    query: any;
    varName: string;
    chainStr?: string;
}): [string, any] {
    let params = {};
    const keys = Object.keys(query);
    const clauses: string[] = [];

    if (!keys.length) {
        return ["", params];
    }

    for (let i = 0; i < keys.length; i += 1) {
        const key = keys[i];
        const value = query[key];

        const [fieldName, operator] = key.split("_");

        let param = "";
        if (chainStr) {
            param = `${chainStr}_${key}`;
        } else {
            param = `${varName}_${key}`;
        }

        const valueIsObject = Boolean(!Array.isArray(value) && Object.keys(value).length && typeof value !== "string");
        if (valueIsObject) {
            const r = createWhereAndParams({ query: value, varName });
            clauses.push(`(${r[0]})`);
            params = { ...params, ...r[1] };
        } else {
            switch (operator) {
                case "IN":
                    clauses.push(`${varName}.${fieldName} IN $${param}`);
                    params[param] = value;
                    break;
                case "AND":
                case "OR":
                    {
                        const innerClauses: string[] = [];

                        for (let ii = 0; ii < value.length; ii += 1) {
                            const r = createWhereAndParams({
                                query: value[ii],
                                varName,
                                chainStr: `${param}${ii > 0 ? ii : ""}`,
                            });

                            innerClauses.push(r[0]);
                            params = { ...params, ...r[1] };
                        }

                        clauses.push(`(${innerClauses.join(` ${operator} `)})`);
                    }
                    break;

                default:
                    clauses.push(`${varName}.${fieldName} = $${param}`);

                    if (typeof value === "number") {
                        params[param] = int(value);
                    } else {
                        params[param] = value;
                    }
            }
        }
    }

    let where = `WHERE `;
    where += clauses.join(" AND ").replace(/WHERE/gi, "");

    return [where, params];
}

export default createWhereAndParams;
