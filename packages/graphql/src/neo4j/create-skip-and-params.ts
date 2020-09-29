/* eslint-disable default-case */
import { ArgumentNode, ObjectValueNode } from "graphql";
import { int } from "neo4j-driver";
import { generate } from "randomstring";

function createSkipAndParams({
    astArgs,
    variableValues,
}: {
    astArgs: ArgumentNode[];
    variableValues: any;
}): [string, any, number] {
    let skipStr = "";
    const params: any = {};
    let skipNumber = 0;

    const optionsArg = astArgs.find((x) => x.name.value === "options");

    if (optionsArg) {
        const optionsValue = optionsArg.value as ObjectValueNode;

        const skipArg = optionsValue.fields.find((x) => x.name.value === "skip");

        /* TODO should we concatenate? Need a better recursive mechanism other than parentID. 
           Using IDS may lead to cleaner code but also sacrifice clean testing.
        */
        const id = generate({
            charset: "alphabetic",
        });

        if (skipArg) {
            switch (skipArg.value.kind) {
                case "Variable":
                    params[id] = int(parseInt(variableValues[skipArg.value.name.value], 10));
                    break;

                case "IntValue":
                    params[id] = int(parseInt(skipArg.value.value, 10));
                    break;

                case "FloatValue":
                    params[id] = parseFloat(skipArg.value.value);
                    break;
            }

            skipStr = `SKIP $${id}`;
            skipNumber = params[id];
        }
    }

    return [skipStr, params, skipNumber];
}

export default createSkipAndParams;
