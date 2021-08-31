import defaultFieldResolver from "./defaultField";
import { Integer, isInt } from "neo4j-driver";

function id(source, args, context, info) {
    const value = defaultFieldResolver(source, args, context, info);

    // @ts-ignore: outputValue is unknown, and to cast to object would be an antipattern
    if (isInt(value)) {
        return (value as Integer).toNumber();
    }

    if (typeof value === "number") {
        return value.toString(10);
    }

    return value;
}

export default id;
