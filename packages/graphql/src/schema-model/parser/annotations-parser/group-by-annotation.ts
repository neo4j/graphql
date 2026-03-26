/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */
import type { DirectiveNode } from "graphql";
import { GroupByAnnotation } from "../../annotation/GroupByAnnotation";

export function parseGroupByAnnotation(_directive: DirectiveNode): GroupByAnnotation {
    return new GroupByAnnotation();
}
