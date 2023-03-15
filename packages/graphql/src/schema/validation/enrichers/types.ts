import type { DefinitionNode } from "graphql";

export type Enricher = (accumulatedDefinitions: DefinitionNode[], definition: DefinitionNode) => DefinitionNode[];
