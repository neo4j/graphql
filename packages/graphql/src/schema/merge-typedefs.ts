import { DefinitionNode, DocumentNode, parse, print } from "graphql";

function mergeTypeDefs(typeDefs: (string | DocumentNode) | (string | DocumentNode)[]): DocumentNode {
    const arrayOfTypeDefs = Array.isArray(typeDefs) ? typeDefs : [typeDefs];

    return {
        kind: "Document",
        definitions: arrayOfTypeDefs.reduce((acc: DefinitionNode[], type) => {
            if (typeof type === "string") {
                return [...acc, ...parse(type).definitions];
            }

            return [...acc, ...parse(print(type)).definitions];
        }, []),
    };
}

export default mergeTypeDefs;
