import type { RelationshipNestedOperationsOption } from "../../constants";
import type { ConcreteEntityAdapter } from "../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { InterfaceEntityAdapter } from "../../schema-model/entity/model-adapters/InterfaceEntityAdapter";

export function relationshipTargetHasRelationshipWithNestedOperation(
    target: ConcreteEntityAdapter | InterfaceEntityAdapter,
    nestedOperation: RelationshipNestedOperationsOption
): boolean {
    return Array.from(target.relationships.values()).some((rel) => rel.nestedOperations.has(nestedOperation));
}
