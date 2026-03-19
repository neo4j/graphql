/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { MutationOperations } from "../../graphql/directives/mutation";
import type { Annotation } from "./Annotation";

export class MutationAnnotation implements Annotation {
    readonly name = "mutation";
    public readonly operations: Set<MutationOperations>;

    constructor({ operations }: { operations: Set<MutationOperations> }) {
        this.operations = operations;
    }
}
