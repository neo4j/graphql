/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import camelcase from "camelcase";
import pascalCase from "../../../utils/pascal-case";

export default function generateRelationshipPropsName(relType: string): string {
    return pascalCase(camelcase(`${relType}-properties`));
}
