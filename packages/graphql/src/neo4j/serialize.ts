import { int } from "neo4j-driver";

function traverse(o: any) {
    function reducer(res: any, [key, value]: [string, any]) {
        const valueIsObject = Boolean(!Array.isArray(value) && Object.keys(value).length && typeof value !== "string");
        if (valueIsObject) {
            return {
                ...res,
                [key]: traverse(value),
            };
        }

        if (Array.isArray(value)) {
            return {
                ...res,
                [key]: value.map((x) => traverse(x)),
            };
        }

        switch (typeof value) {
            case "number":
                return {
                    ...res,
                    [key]: int(value),
                };

            default:
                return {
                    ...res,
                    [key]: value,
                };
        }
    }

    return Object.entries(o).reduce(reducer, {});
}

function serialize(result: any): any {
    return traverse(result);
}

export default serialize;
