import { ArgumentNode, ObjectValueNode } from "graphql";
import { int } from "neo4j-driver";

function createSkipAndParams({ astArgs, graphQLArgs }: { graphQLArgs: any; astArgs: ArgumentNode[] }): [string, any] {
    let skipStr = "";
    const params: any = {};

    const optionsArg = astArgs.find((x) => x.name.value === "options");

    if (optionsArg) {
        const optionsValue = optionsArg.value as ObjectValueNode;

        const skipField = optionsValue.fields.find((x) => x.name.value === "limit");

        if (skipField) {
            skipStr = "SKIP $skip";

            if ("value" in skipField.value) {
                params.skip = skipField.value.value;

                if (skipField.value.kind === "IntValue") {
                    params.skip = int(parseInt(skipField.value.value, 10));
                }

                if (skipField.value.kind === "FloatValue") {
                    params.skip = parseFloat(skipField.value.value);
                }
            } else {
                params.skip = int(graphQLArgs.options[skipField.name.value]);
            }
        }
    }

    return [skipStr, params];
}

export default createSkipAndParams;
