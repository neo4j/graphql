import { valueFromASTUntyped } from "graphql";
import { Node } from "../classes";

function parseIgnoredDirective(node: Node) {
    const ignoredDirective = (node.neoDirectives || []).find((directive) => directive.name.value === "ignored");

    if (!ignoredDirective) {
        return [];
    }

    const allResolvers = ["create", "read", "update", "delete"];
    const result: string[] = [];
    const error = new Error(`type ${node.name} does not implement directive ${ignoredDirective.name.value} correctly`);

    ignoredDirective.arguments?.forEach((argument) => {
        if (argument.name.value !== "resolvers") {
            throw error;
        } else {
            const argumentValue = valueFromASTUntyped(argument.value);

            if (argument.value.kind === "ListValue") {
                argumentValue.forEach((val) => {
                    if (allResolvers.includes(val)) {
                        result.push(val);
                    } else {
                        throw error;
                    }
                });
            } else if (argumentValue === "*") {
                result.push(...allResolvers);
            }
        }
    });

    return result;
}

export default parseIgnoredDirective;
