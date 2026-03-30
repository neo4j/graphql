/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import Cypher from "@neo4j/cypher-builder";
import type { Driver, Result, Session } from "neo4j-driver";
import type { UniqueType } from "./graphql-types";
import { runCypher } from "./run-cypher";

export async function cleanNodes(driver: Driver, labels: Array<string | UniqueType>): Promise<Result> {
    const nodeRef = new Cypher.Node();

    const nodeHasLabelPredicates = labels.map((l) => {
        return nodeRef.hasLabel(`${l}`);
    });

    const nodeHasAnyLabelPredicate = Cypher.or(...nodeHasLabelPredicates);

    const query = new Cypher.Match(new Cypher.Pattern(nodeRef)).where(nodeHasAnyLabelPredicate).detachDelete(nodeRef);
    const { cypher } = query.build();
    return driver.executeQuery(cypher);
}

export async function cleanNodesUsingSession(session: Session, labels: Array<string | UniqueType>): Promise<Result> {
    const nodeRef = new Cypher.Node();

    const nodeHasLabelPredicates = labels.map((l) => {
        return nodeRef.hasLabel(`${l}`);
    });

    const nodeHasAnyLabelPredicate = Cypher.or(...nodeHasLabelPredicates);

    const query = new Cypher.Match(new Cypher.Pattern(nodeRef)).where(nodeHasAnyLabelPredicate).detachDelete(nodeRef);
    const { cypher } = query.build();
    return runCypher(session, cypher);
}
