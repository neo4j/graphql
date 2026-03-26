/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { ConcreteEntity } from "../entity/ConcreteEntity";
import type { Annotation } from "./Annotation";

export class CypherAnnotation implements Annotation {
    readonly name = "cypher";
    public statement: string;
    public columnName: string;
    public targetEntity?: ConcreteEntity;

    constructor({ statement, columnName }: { statement: string; columnName: string }) {
        this.statement = statement;
        this.columnName = columnName;
    }
}
