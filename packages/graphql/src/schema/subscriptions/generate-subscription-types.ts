import { SchemaComposer } from "graphql-compose";
import { Node } from "../../classes";
import { lowerFirst } from "../../utils/lower-first";

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

        subscriptionComposer.addFields({
            [`${lowerFirstNodeName}Created`]: {
                args: {},
                type: nodeCreatedEvent,
            },
            [`${lowerFirstNodeName}Updated`]: {
                args: {},
                type: nodeUpdatedEvent,
            },
            [`${lowerFirstNodeName}Deleted`]: {
                args: {},
                type: nodeDeletedEvent,
            },
        });
    });
}
