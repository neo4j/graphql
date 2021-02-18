import { DirectiveNode, valueFromASTUntyped } from "graphql";
import { Exclude } from "../classes";

function parseExcludeDirective(excludeDirective: DirectiveNode, type: string) {
    if (!excludeDirective || excludeDirective.name.value !== "exclude") {
        throw new Error("Undefined or incorrect directive passed into parseExcludeDirective function");
    }

    const error = new Error(`type ${type} does not implement directive ${excludeDirective.name.value} correctly`);
    const result: string[] = [];
    const allResolvers = ["create", "read", "update", "delete"];

    excludeDirective.arguments?.forEach((argument) => {
        if (argument.name.value !== "operations") {
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

    return new Exclude({ operations: result });
}

export default parseExcludeDirective;
