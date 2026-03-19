/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { Neo4jGraphQLSchemaModel } from "../../../schema-model/Neo4jGraphQLSchemaModel";
import type { NodeSubscriptionsEvent, SubscriptionsEvent } from "../../../types";
import { serializeNeo4jValue } from "../../../utils/neo4j-serializers";
import type { CDCNodeEvent, CDCQueryResponse } from "./cdc-types";

export class CDCEventParser {
    private schemaModel: Neo4jGraphQLSchemaModel;

    constructor(schemaModel: Neo4jGraphQLSchemaModel) {
        this.schemaModel = schemaModel;
    }

    public parseCDCEvent({ event: cdcEvent, metadata }: CDCQueryResponse): SubscriptionsEvent | undefined {
        const timestamp = metadata.txStartTime.toStandardDate().getTime();

        if (cdcEvent.eventType === "n") {
            return this.parseNodeEvent(cdcEvent, timestamp);
        } else {
            // Relationship not supported
            return undefined;
            // return this.parseRelationshipEvent(cdcEvent, timestamp);
        }
    }

    private parseNodeEvent(cdcEvent: CDCNodeEvent, timestamp: number): NodeSubscriptionsEvent | undefined {
        const typenames = this.getTypenamesFromLabels({
            labels: cdcEvent.labels,
            schemaModel: this.schemaModel,
        });
        if (!typenames || !typenames[0]) return undefined; // What happens with multiple typenames?

        const typename = typenames[0];
        switch (cdcEvent.operation) {
            case "c":
                return {
                    event: "create",
                    typename,
                    properties: {
                        old: undefined,
                        new: this.serializeProperties(cdcEvent.state.after?.properties) || {},
                    },
                    id: cdcEvent.elementId as any,
                    timestamp,
                };
            case "d":
                return {
                    event: "delete",
                    typename,
                    properties: {
                        old: this.serializeProperties(cdcEvent.state.before?.properties) || {},
                        new: undefined,
                    },
                    id: cdcEvent.elementId as any,
                    timestamp,
                };

            case "u":
                return {
                    event: "update",
                    typename,
                    properties: {
                        old: this.serializeProperties(cdcEvent.state.before?.properties) || {},
                        new: this.serializeProperties(cdcEvent.state.after?.properties) || {},
                    },
                    id: cdcEvent.elementId as any,
                    timestamp,
                };
        }
    }

    private getTypenamesFromLabels({
        labels,
        schemaModel,
    }: {
        labels: string[] | undefined;
        schemaModel: Neo4jGraphQLSchemaModel;
    }): string[] | undefined {
        if (!labels || !labels.length) {
            // Any type should have at least one label
            return undefined;
        }
        return schemaModel.getEntitiesByLabels(labels).map((entity) => entity.name);
    }

    private serializeProperties(properties: Record<string, any> | undefined): Record<string, any> | undefined {
        if (!properties) {
            return undefined;
        }

        return Object.entries(properties).reduce(
            (serializedProps, [k, v]) => {
                serializedProps[k] = serializeNeo4jValue(v);
                return serializedProps;
            },
            {} as Record<string, any>
        );
    }
}
