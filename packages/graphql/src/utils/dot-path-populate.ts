import dotProp from "dot-prop";
import { Context } from "../classes";

interface RandomObject {
    [k: string]: any;
}

function dotPathPopulate({ obj, context }: { obj: RandomObject; context: Context }): RandomObject {
    const jwt = context.getJWT();

    function traverse(value: any): any {
        function reducer(res: any, entry: [string, any]) {
            if (Array.isArray(entry[1])) {
                return {
                    ...res,
                    [entry[0]]: entry[1].map((x) => traverse(x)),
                };
            }

            return {
                ...res,
                [entry[0]]: traverse(entry[1]),
            };
        }

        // GraphQL type limited in values
        switch (typeof value) {
            case "boolean":
            case "number":
                return value;

            case "string": {
                const [, jwtPath] = value.split("$jwt.");
                const [, ctxPath] = value.split("$context.");

                if (jwtPath) {
                    return dotProp.get({ value: jwt }, `value.${jwtPath}`);
                }

                if (ctxPath) {
                    return dotProp.get({ value: context.graphQLContext }, `value.${ctxPath}`);
                }

                return value;
            }

            default:
                return Object.entries(value).reduce(reducer, {});
        }
    }

    return traverse(obj);
}

export default dotPathPopulate;
