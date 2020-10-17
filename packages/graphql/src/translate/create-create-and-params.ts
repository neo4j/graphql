import { NeoSchema, Node } from "../classes";

interface Res {
    create: string;
    params: any;
}

function createCreateAndParams({
    input,
    chainStr,
    varName,
    node,
}: {
    input: any;
    varName: string;
    node: Node;
    neoSchema: NeoSchema;
    chainStr?: string;
    withVars: string[];
}): [string, any] {
    function reducer(res: Res, [key, value]: [string, any]): Res {
        let param = "";
        if (chainStr) {
            param = `${chainStr}_${key}`;
        } else {
            param = `${varName}_${key}`;
        }

        const relationField = node.relationFields.find((x) => x.fieldName === key);
        if (relationField) {
            // TODO
            return res;
        }

        res.create += `\n SET ${varName}.${key} = $${param}`;
        res.params[param] = value;

        return res;
    }

    const { create, params } = Object.entries(input).reduce(reducer, {
        create: `CREATE (${varName}:${node.name})`,
        params: {},
    }) as Res;

    return [create, params];
}

export default createCreateAndParams;
