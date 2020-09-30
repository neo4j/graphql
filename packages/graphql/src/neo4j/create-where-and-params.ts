import { generate } from "randomstring";

function createWhereAndParams({
    query,
    varName,
    parentName,
}: {
    query: any;
    varName: string;
    parentName?: string;
}): [string, any] {
    let params = {};
    let where = `WHERE`;

    const keys = Object.keys(query);
    for (let i = 0; i < keys.length; i += 1) {
        const k = keys[i];
        const v = query[k];

        if (!Array.isArray(v) && Object.keys(v).length && typeof v !== "string") {
            const r = createWhereAndParams({ query: v, parentName: k, varName });

            const whereGone = r[0].replace("WHERE", "");
            where += ` (${whereGone})`;
            params = { ...params, ...r[1] };
        } else {
            const key = parentName || k;
            const [fieldName, operator] = key.split("_");

            /* TODO should we concatenate? Need a better recursive mechanism other than parentID. 
               Using IDS may lead to cleaner code but also sacrifice clean testing.
            */
            const id = generate({
                charset: "alphabetic",
            });

            switch (operator) {
                case "IN":
                    where += ` ${varName}.${fieldName} IN $${id}`;
                    params[id] = v;
                    break;
                case "AND":
                    where += ` (`;
                    for (let ii = 0; ii < v.length; ii += 1) {
                        const r = createWhereAndParams({ query: v[ii], parentName, varName });

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
                        const r = createWhereAndParams({ query: v[ii], parentName, varName });

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
                    where += ` ${varName}.${fieldName} = $${id}`;
                    params[id] = v;
            }
        }

        if (keys[i + 1]) {
            where += " AND";
        }
    }

    return [where, params];
}

export default createWhereAndParams;
