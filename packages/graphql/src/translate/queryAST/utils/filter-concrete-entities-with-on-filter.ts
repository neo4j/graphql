import type { ConcreteEntityAdapter } from "../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { InterfaceEntityAdapter } from "../../../schema-model/entity/model-adapters/InterfaceEntityAdapter";
import type { UnionEntityAdapter } from "../../../schema-model/entity/model-adapters/UnionEntityAdapter";
import { isInterfaceEntity } from "./is-interface-entity";

/**
 * Returns the concrete entities presents in the where [_on] argument,
 * if the where argument is not defined then returns all the concrete entities of the composite target.
 **/
export function filterConcreteEntitiesWithOnFilter(
    compositeTarget: UnionEntityAdapter | InterfaceEntityAdapter,
    whereArgs: Record<string, any>
): ConcreteEntityAdapter[] {
    if (!whereArgs?._on || countSharedFilters(whereArgs) > 0) {
        return compositeTarget.concreteEntities;
    }
    const concreteEntities: ConcreteEntityAdapter[] = [];
    const where = isInterfaceEntity(compositeTarget) ? whereArgs._on : whereArgs;
    for (const concreteEntity of compositeTarget.concreteEntities) {
        if (where[concreteEntity.name]) {
            concreteEntities.push(concreteEntity);
        }
    }
    return concreteEntities;
}

function countSharedFilters(whereArgs: Record<string, any>): number {
    return Object.entries(whereArgs).filter(([key]) => key !== "_on").length;
}
