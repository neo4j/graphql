import { AuthRule, NeoSchema, Node } from "../classes";

interface Res {
    authPredicates: string[];
    params: any;
}

function createAuthAndParams({
    rules,
    jwt,
    varName,
    node,
}: {
    rules: AuthRule[];
    jwt: any;
    node: Node;
    neoSchema: NeoSchema;
    varName: string;
}): [string, any] {
    function reducer(res: Res, rule: AuthRule, index: number): Res {
        const chainStr = `${varName}_auth${index}`;

        Object.entries(rule.allow as { [k: string]: string }).forEach(([key, value]) => {
            const isPrimitiveField = node.primitiveFields.find((x) => x.fieldName === key);
            if (isPrimitiveField) {
                const param = `${chainStr}_${key}`;
                res.authPredicates.push(`${varName}.${key} = $${param}`);
                res.params[param] = jwt[value];
            }

            // TODO isRelationField
            // TODO _IN, AND, OR ?
        });

        return res;
    }

    const { authPredicates, params } = rules.reduce(reducer, { authPredicates: [], params: {} }) as Res;

    const authStr = authPredicates.length
        ? `CALL apoc.util.validate(NOT(${authPredicates.join("\n")}), "Forbidden", [0])`
        : "";

    return [authStr, params];
}

export default createAuthAndParams;
