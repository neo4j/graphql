/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import Cypher from "@neo4j/cypher-builder";
import type { AttributeAdapter } from "../../../../schema-model/attribute/model-adapters/AttributeAdapter";
import type { QueryASTContext } from "../QueryASTContext";
import { InputField } from "./InputField";

export class IdField extends InputField {
    private attribute: AttributeAdapter;

    constructor(name: string, attribute: AttributeAdapter, attachedTo: "node" | "relationship" = "node") {
        super(name, attachedTo);
        this.attribute = attribute;
    }
    public getChildren() {
        return [];
    }

    public getSetParams(queryASTContext: QueryASTContext<Cypher.Node>): Cypher.SetParam[] {
        const target = this.getTarget(queryASTContext);
        const setParam: Cypher.SetParam = [target.property(this.attribute.databaseName), Cypher.randomUUID()];
        return [setParam];
    }
}
