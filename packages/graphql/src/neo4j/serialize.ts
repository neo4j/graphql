import { isInt } from "neo4j-driver";

function replacer(_, value: any): any {
    if (isInt(value)) {
        return value.toNumber();
    }

    return value;
}

function serialize(result: any): any {
    return JSON.parse(JSON.stringify(result, replacer));
}

export default serialize;
