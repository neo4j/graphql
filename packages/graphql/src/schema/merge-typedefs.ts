import { DefinitionNode, DocumentNode, parse, print } from "graphql";
import { TypeDefs } from "../types";

function mergeTypeDefs(typeDefs: TypeDefs): DocumentNode {
    const arrayOfTypeDefs = Array.isArray(typeDefs) ? typeDefs : [typeDefs];

    return {
        kind: "Document",
        definitions: arrayOfTypeDefs.reduce((acc: DefinitionNode[], type) => {
            if (typeof type === "string") {
                return [...acc, ...parse(type).definitions];
            }

            if (typeof type === "function") {
                return [...acc, ...mergeTypeDefs(type()).definitions];
            }

            return [...acc, ...parse(print(type)).definitions];
        }, []),
    };
}

export default mergeTypeDefs;
