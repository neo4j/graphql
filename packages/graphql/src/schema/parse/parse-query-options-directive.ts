import { DirectiveNode, ObjectTypeDefinitionNode } from "graphql";
import * as neo4j from "neo4j-driver";
import { QueryOptions } from "../../types";
import parseValueNode from "../parse-value-node";

function parseQueryOptionsDirective({
    directive,
    definition,
}: {
    directive: DirectiveNode;
    definition: ObjectTypeDefinitionNode;
}): QueryOptions {
    const defaultLimitArgument = directive.arguments?.find((direc) => direc.name.value === "defaultLimit");
    let defaultLimit: neo4j.Integer | undefined;
    if (defaultLimitArgument) {
        const parsed = parseValueNode(defaultLimitArgument.value) as number;

        if (parsed <= 0) {
            throw new Error(
                `${definition.name.value} @queryOptions(defaultLimit: ${parsed}) invalid value: '${parsed}' try a number greater than 0`
            );
        }

        defaultLimit = neo4j.int(parsed);
    }

    return {
        defaultLimit,
    };
}

export default parseQueryOptionsDirective;
