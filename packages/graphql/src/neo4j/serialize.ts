import { int } from "neo4j-driver";

function traverse(v: any) {
    function reducer(res: any, [key, value]: [string, any]) {
        if (Array.isArray(value)) {
            return {
                ...res,
                [key]: value.map((x) => traverse(x)),
            };
        }

        return {
            ...res,
            [key]: traverse(value),
        };
    }

    switch (typeof v) {
        case "number":
            return int(v);

        case "string":
            return v;

        default:
            return Object.entries(v).reduce(reducer, {});
    }
}

function serialize(result: any): any {
    return traverse(result);
}

export default serialize;
