import { DirectiveNode, valueFromASTUntyped, ArgumentNode } from "graphql";
import { Exclude } from "../classes";

function parseExcludeDirective(excludeDirective: DirectiveNode) {
    if (!excludeDirective || excludeDirective.name.value !== "exclude") {
        throw new Error("Undefined or incorrect directive passed into parseExcludeDirective function");
    }

    const allResolvers = ["create", "read", "update", "delete"];

    if (!excludeDirective.arguments?.length) {
        return new Exclude({ operations: allResolvers });
    }

    const operations = excludeDirective.arguments?.find((a) => a.name.value === "operations") as ArgumentNode;

    const argumentValue = valueFromASTUntyped(operations.value);

    const result = argumentValue.map((val: string) => val.toLowerCase());

    return new Exclude({ operations: result });
}

export default parseExcludeDirective;
