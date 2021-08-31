import defaultFieldResolver from "./defaultField";
import { Integer, isInt } from "neo4j-driver";

function int(source, args, context, info) {
    const value = defaultFieldResolver(source, args, context, info);

    // @ts-ignore: outputValue is unknown
    if (isInt(value)) {
        return (value as Integer).toNumber();
    }

    return value;
}

export default int;
