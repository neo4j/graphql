import { DirectiveNode, valueFromASTUntyped } from "graphql";
import { Node, Ignored } from "../classes";

function parseIgnoredDirective(ignoredDirective: DirectiveNode, type: string) {
    if (!ignoredDirective || ignoredDirective.name.value !== "ignored") {
        throw new Error("Undefined or incorrect directive passed into parseIgnoredDirective function");
    }

    const error = new Error(`type ${type} does not implement directive ${ignoredDirective.name.value} correctly`);
    const result: string[] = [];
    const allResolvers = ["create", "read", "update", "delete"];

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

    return new Ignored({ resolvers: result });
}

export default parseIgnoredDirective;
