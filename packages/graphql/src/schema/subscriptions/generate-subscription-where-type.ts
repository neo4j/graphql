import { InputTypeComposer, SchemaComposer } from "graphql-compose";
import { Node } from "../../classes";
import { objectFieldsToSubscriptionsWhereInputFields } from "../to-compose";

export function generateSubscriptionWhereType(node: Node, schemaComposer: SchemaComposer): InputTypeComposer {
    const whereFields = objectFieldsToSubscriptionsWhereInputFields([
        ...node.primitiveFields,
        ...node.cypherFields,
        ...node.enumFields,
        ...node.scalarFields,
        ...node.interfaceFields,
        ...node.objectFields,
        ...node.unionFields,
        ...node.temporalFields,
        ...node.pointFields,
        ...node.computedFields,
    ]);

    return schemaComposer.createInputTC({
        name: `${node.name}SubscriptionWhere`,
        fields: whereFields,
    });
}
