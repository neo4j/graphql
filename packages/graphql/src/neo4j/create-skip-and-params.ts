import { ArgumentNode, ObjectValueNode } from "graphql";
import { int } from "neo4j-driver";

function createSkipAndParams({ astArgs, graphQLArgs }: { graphQLArgs: any; astArgs: ArgumentNode[] }): [string, any] {
    let skipStr = "";
    const params: any = {};

    const optionsArg = astArgs.find((x) => x.name.value === "options");

    if (optionsArg) {
        const optionsValue = optionsArg.value as ObjectValueNode;

        const skipArg = optionsValue.fields.find((x) => x.name.value === "skip");

        if (skipArg) {
            skipStr = "SKIP $skip";

            if ("value" in skipArg.value) {
                params.skip = skipArg.value.value;

                if (skipArg.value.kind === "IntValue") {
                    params.skip = int(parseInt(skipArg.value.value, 10));
                }

                if (skipArg.value.kind === "FloatValue") {
                    params.skip = parseFloat(skipArg.value.value);
                }
            } else {
                params.skip = int(graphQLArgs.options[skipArg.name.value]);
            }
        }
    }

    return [skipStr, params];
}

export default createSkipAndParams;
