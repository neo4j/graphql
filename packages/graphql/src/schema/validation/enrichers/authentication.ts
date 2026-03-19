/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { EnricherContext } from "../EnricherContext";
import type { Enricher } from "../types";
import { directiveEnricher } from "./directive/directive";

export function authenticationDirectiveEnricher(enricherContext: EnricherContext): Enricher {
    return directiveEnricher(
        enricherContext,
        "authentication",
        (currentDirectiveDirective) => currentDirectiveDirective
    );
}
