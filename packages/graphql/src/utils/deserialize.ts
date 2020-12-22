import { isInt, isDateTime } from "neo4j-driver";

function replacer(_, value: any): any {
    if (isInt(value)) {
        return value.toNumber();
    }

    if (isDateTime(value)) {
        return new Date(value.toString()).toISOString();
    }

    return value;
}

function deserialize(result: any): any {
    return JSON.parse(JSON.stringify(result, replacer));
}

export default deserialize;
