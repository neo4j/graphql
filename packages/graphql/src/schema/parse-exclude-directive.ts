import { DirectiveNode, valueFromASTUntyped } from "graphql";
import { Exclude } from "../classes";

function parseExcludeDirective(excludeDirective: DirectiveNode, type: string) {
    if (!excludeDirective || excludeDirective.name.value !== "exclude") {
        throw new Error("Undefined or incorrect directive passed into parseExcludeDirective function");
    }

    const error = new Error(`type ${type} does not implement directive ${excludeDirective.name.value} correctly`);
    const result: string[] = [];
    const allResolvers = ["create", "read", "update", "delete"];

    if (!excludeDirective.arguments?.length) {
        return new Exclude({ operations: allResolvers });
    }

    excludeDirective.arguments?.forEach((argument) => {
        if (argument.name.value !== "operations") {
            throw error;
        }

        const argumentValue = valueFromASTUntyped(argument.value);

        argumentValue.forEach((val: string) => {
            const lower = val.toLowerCase();

            if (allResolvers.includes(lower)) {
                result.push(lower);
            } else {
                throw error;
            }
        });
    });

    return new Exclude({ operations: result });
}

export default parseExcludeDirective;
