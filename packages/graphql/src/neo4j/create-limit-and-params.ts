import { ArgumentNode, ObjectValueNode } from "graphql";
import { int } from "neo4j-driver";

function createLimitAndParams({ astArgs, graphQLArgs }: { graphQLArgs: any; astArgs: ArgumentNode[] }): [string, any] {
    let limitStr = "";
    const params: any = {};

    const optionsArg = astArgs.find((x) => x.name.value === "options");

    if (optionsArg) {
        const optionsValue = optionsArg.value as ObjectValueNode;

        const limitArg = optionsValue.fields.find((x) => x.name.value === "limit");

        if (limitArg) {
            limitStr = "LIMIT $limit";

            if ("value" in limitArg.value) {
                params.limit = limitArg.value.value;

                if (limitArg.value.kind === "IntValue") {
                    params.limit = int(parseInt(limitArg.value.value, 10));
                }

                if (limitArg.value.kind === "FloatValue") {
                    params.limit = parseFloat(limitArg.value.value);
                }
            } else {
                params.limit = int(graphQLArgs.options[limitArg.name.value]);
            }
        }
    }

    return [limitStr, params];
}

export default createLimitAndParams;
