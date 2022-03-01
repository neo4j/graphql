import { SchemaComposer } from "graphql-compose";
import { Node } from "src/classes";
import { lowerFirst } from "src/utils/lower-first";
import getWhereFields from "../get-where-fields";

export function generateSubscriptionTypes({
    schemaComposer,
    nodes,
}: {
    schemaComposer: SchemaComposer;
    nodes: Node[];
}) {
    const subscriptionComposer = schemaComposer.Subscription;

    nodes.forEach((node) => {
        const composeNode = schemaComposer.getOTC(node.name);

        const lowerFirstNodeName = lowerFirst(node.name);

        const nodeCreatedEvent = schemaComposer.createObjectTC({
            name: `${node.name}CreatedEvent`,
            fields: {
                [lowerFirstNodeName]: composeNode,
            },
        });

        const nodeUpdatedEvent = schemaComposer.createObjectTC({
            name: `${node.name}UpdatedEvent`,
            fields: {
                [lowerFirstNodeName]: composeNode,
            },
        });

        const nodeDeletedEvent = schemaComposer.createObjectTC({
            name: `${node.name}DeletedEvent`,
            fields: {
                [lowerFirstNodeName]: composeNode,
            },
        });

        const subscriptionWhereFields = getWhereFields({
            typeName: node.name,
            // TODO: should this actually be true
            enableRegex: true,
            fields: {
                temporalFields: node.temporalFields,
                enumFields: node.enumFields,
                pointFields: node.pointFields,
                primitiveFields: node.primitiveFields,
                scalarFields: node.scalarFields,
            },
        });

        const subscriptionWhere = schemaComposer.createInputTC({
            name: `${node.name}SubscriptionWhere`,
            fields: subscriptionWhereFields,
        });

        subscriptionComposer.addFields({
            [`${lowerFirstNodeName}Created`]: {
                args: {
                    where: subscriptionWhere,
                },
                type: nodeCreatedEvent,
            },
            [`${lowerFirstNodeName}Updated`]: {
                args: {
                    where: subscriptionWhere,
                },
                type: nodeUpdatedEvent,
            },
            [`${lowerFirstNodeName}Deleted`]: {
                args: {
                    where: subscriptionWhere,
                },
                type: nodeDeletedEvent,
            },
        });
    });
}
