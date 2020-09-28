import { ArgumentNode, ObjectValueNode } from "graphql";
import { int } from "neo4j-driver";

function createLimitAndParams({ astArgs, graphQLArgs }: { graphQLArgs: any; astArgs: ArgumentNode[] }): [string, any] {
    let limitStr = "";
    const params: any = {};

    const optionsArg = astArgs.find((x) => x.name.value === "options");

    if (optionsArg) {
        const optionsValue = optionsArg.value as ObjectValueNode;

        const limitField = optionsValue.fields.find((x) => x.name.value === "limit");

        if (limitField) {
            limitStr = "LIMIT $limit";

            if ("value" in limitField.value) {
                params.limit = limitField.value.value;

                if (limitField.value.kind === "IntValue") {
                    params.limit = int(parseInt(limitField.value.value, 10));
                }

                if (limitField.value.kind === "FloatValue") {
                    params.limit = parseFloat(limitField.value.value);
                }
            } else {
                params.limit = int(graphQLArgs.options[limitField.name.value]);
            }
        }
    }

    return [limitStr, params];
}

export default createLimitAndParams;
