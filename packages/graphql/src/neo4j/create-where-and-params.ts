import { int } from "neo4j-driver";

function createWhereAndParams({
    query,
    varName,
    paramVarName,
}: {
    query: any;
    varName: string;
    paramVarName?: string;
}): [string, any] {
    let params = {};
    let where = `WHERE`;

    const keys = Object.keys(query);
    for (let i = 0; i < keys.length; i += 1) {
        const key = keys[i];
        const v = query[key];

        const [fieldName, operator] = key.split("_");

        let param = "";
        if (paramVarName) {
            param = `${paramVarName}_${key}`;
        } else {
            param = `${varName}_${key}`;
        }

        if (!Array.isArray(v) && Object.keys(v).length && typeof v !== "string") {
            const r = createWhereAndParams({ query: v, varName });

            const whereGone = r[0].replace("WHERE", "");
            where += ` (${whereGone})`;
            params = { ...params, ...r[1] };
        } else {
            switch (operator) {
                case "IN":
                    where += ` ${varName}.${fieldName} IN $${param}`;
                    params[param] = v;
                    break;
                case "AND":
                    where += ` (`;
                    for (let ii = 0; ii < v.length; ii += 1) {
                        const r = createWhereAndParams({
                            query: v[ii],
                            varName,
                            paramVarName: `${param}${ii > 0 ? ii : ""}`,
                        });

                        const whereGone = r[0].replace("WHERE", "");
                        where += ` (${whereGone}) `;
                        params = { ...params, ...r[1] };

                        if (v[ii + 1]) {
                            where += " AND";
                        }
                    }

                    where += ` ) `;

                    break;
                case "OR":
                    where += ` (`;

                    for (let ii = 0; ii < v.length; ii += 1) {
                        const r = createWhereAndParams({
                            query: v[ii],
                            varName,
                            paramVarName: `${param}${ii > 0 ? ii : ""}`,
                        });

                        const whereGone = r[0].replace("WHERE", "");
                        where += ` (${whereGone}) `;
                        params = { ...params, ...r[1] };

                        if (v[ii + 1]) {
                            where += " OR";
                        }
                    }

                    where += ` ) `;
                    break;

                default:
                    where += ` ${varName}.${fieldName} = $${param}`;

                    if (typeof v === "number") {
                        params[param] = int(v);
                    } else {
                        params[param] = v;
                    }
            }
        }

        if (keys[i + 1]) {
            where += " AND";
        }
    }

    return [where, params];
}

export default createWhereAndParams;
