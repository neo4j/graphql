/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import Cypher from "@neo4j/cypher-builder";
import { Neo4jGraphQLTemporalType } from "../../../../schema-model/attribute/AttributeType";
import type { AttributeAdapter } from "../../../../schema-model/attribute/model-adapters/AttributeAdapter";
import type { QueryASTContext } from "../QueryASTContext";
import { InputField } from "./InputField";

export class TimestampField extends InputField {
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
        const relatedCypherExpression = this.GetFunctionForTemporalType(
            this.attribute.type.name as Neo4jGraphQLTemporalType
        );
        const setParam: Cypher.SetParam = [target.property(this.attribute.databaseName), relatedCypherExpression];
        return [setParam];
    }

    private GetFunctionForTemporalType(type: Neo4jGraphQLTemporalType): Cypher.Function {
        switch (type) {
            case Neo4jGraphQLTemporalType.DateTime:
                return Cypher.datetime();

            case Neo4jGraphQLTemporalType.LocalDateTime:
                return Cypher.localdatetime();

            case Neo4jGraphQLTemporalType.Time:
                return Cypher.time();

            case Neo4jGraphQLTemporalType.LocalTime:
                return Cypher.localtime();

            default: {
                throw new Error(`Transpile error: Expected type to one of:
                [ 
                    ${Neo4jGraphQLTemporalType.DateTime},
                    ${Neo4jGraphQLTemporalType.LocalDateTime}, 
                    ${Neo4jGraphQLTemporalType.Time},
                    ${Neo4jGraphQLTemporalType.LocalTime}
                ]
                but found ${type} instead`);
            }
        }
    }
}
