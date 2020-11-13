import { Node, NeoSchema } from "../classes";

interface Res {
    strs: string[];
    params: any;
}

function createUpdateAndParams({
    updateInput,
    chainStr,
    varName,
}: {
    updateInput: any;
    varName: string;
    chainStr?: string;
    node: Node;
    neoSchema: NeoSchema;
}): [string, any] {
    function reducer(res: Res, [key, value]: [string, any]) {
        let param;

        if (chainStr) {
            param = `${chainStr}_${key}`;
        } else {
            param = `${varName}_update_${key}`;
        }

        res.strs.push(`SET ${varName}.${key} = $${param}`);
        res.params[param] = value;

        return res;
    }

    const { strs, params } = Object.entries(updateInput).reduce(reducer, { strs: [], params: {} }) as Res;

    return [strs.join("\n"), params];
}

export default createUpdateAndParams;
