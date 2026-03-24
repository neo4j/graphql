/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */
import type { DefinitionNode } from "graphql";
import { Kind } from "graphql";
import type { EnricherContext } from "../../EnricherContext";
import type { Enricher } from "../../types";
import type {
    CREATE_DIRECTIVE_DEFINITION_FN,
    ObjectOrInterfaceDefinitionNode,
    ObjectOrInterfaceExtensionNode,
} from "./utils";
import { containsDirective } from "./utils";

function findDirectiveByTypeName(typeName: string, enricherContext: EnricherContext, directiveName: string): boolean {
    const userDocumentObject = enricherContext.userDefinitionNodeMap[typeName] as
        | ObjectOrInterfaceDefinitionNode
        | undefined;
    const userDocumentExtensions = enricherContext.userDefinitionNodeMap[
        `${userDocumentObject?.name.value}_EXTENSIONS`
    ] as Array<ObjectOrInterfaceExtensionNode> | undefined;
    if (
        (userDocumentObject && containsDirective(userDocumentObject, directiveName)) ||
        (userDocumentExtensions && userDocumentExtensions.find((e) => containsDirective(e, directiveName)))
    ) {
        return true;
    }
    return false;
}

// Enriches the directive definition itself
export function definitionsEnricher(
    enricherContext: EnricherContext,
    directiveName: string,
    createDefinitionFn: CREATE_DIRECTIVE_DEFINITION_FN
): Enricher {
    return (accumulatedDefinitions: DefinitionNode[], definition: DefinitionNode) => {
        switch (definition.kind) {
            case Kind.INTERFACE_TYPE_DEFINITION:
            case Kind.OBJECT_TYPE_DEFINITION: {
                const typeName = definition.name.value;
                const hasDirective = findDirectiveByTypeName(typeName, enricherContext, directiveName);
                if (hasDirective) {
                    const definitions = createDefinitionFn(typeName, enricherContext.augmentedSchema);
                    accumulatedDefinitions.push(...definitions);
                }
            }
        }
        accumulatedDefinitions.push(definition);
        return accumulatedDefinitions;
    };
}
