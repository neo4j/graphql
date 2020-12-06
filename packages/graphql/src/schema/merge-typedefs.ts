import { DocumentNode, parse, print } from "graphql";

function mergeTypeDefs(typeDefs: (string | DocumentNode) | (string | DocumentNode)[]): DocumentNode {
    const arrayOfTypeDefs = Array.isArray(typeDefs) ? typeDefs : [typeDefs];

    return {
        kind: "Document",
        definitions: arrayOfTypeDefs.flatMap((type) => {
            if (typeof type === "string") {
                return parse(type).definitions;
            }

            return parse(print(type)).definitions;
        }),
    };
}

export default mergeTypeDefs;
