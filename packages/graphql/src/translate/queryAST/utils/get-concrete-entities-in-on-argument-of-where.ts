import type { ConcreteEntityAdapter } from "../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { InterfaceEntityAdapter } from "../../../schema-model/entity/model-adapters/InterfaceEntityAdapter";
import type { UnionEntityAdapter } from "../../../schema-model/entity/model-adapters/UnionEntityAdapter";
import { isObject } from "../../../utils/utils";
import { isUnionEntity } from "./is-union-entity";

/**
 * Returns the concrete entities presents in the where [_on] argument,
 * if the where argument is not defined then returns all the concrete entities of the composite target.
 **/
export function getConcreteEntitiesInOnArgumentOfWhere(
    compositeTarget: UnionEntityAdapter | InterfaceEntityAdapter,
    whereArgs: Record<string, any>,
    isConnection = false
): ConcreteEntityAdapter[] {
    if (isUnionEntity(compositeTarget)) {
        return getConcreteEntitiesInOnArgumentOfWhereUnion(compositeTarget, whereArgs);
    } else {
        const nodeWhereArgs = getInterfaceNodeWhere(whereArgs, isConnection);
        return getConcreteEntitiesInOnArgumentOfWhereInterface(compositeTarget, nodeWhereArgs);
    }
}

// Helper required as the filters interface API are different between ConnectionAPI and SimpleAPI
function getInterfaceNodeWhere(whereArgs?: Record<string, any>, isConnection = false): Record<string, any> {
    if (isObject(whereArgs)) {
        if (isConnection) {
            return whereArgs.node ?? {};
        } else {
            return whereArgs;
        }
    }
    return {};
}

function getConcreteEntitiesInOnArgumentOfWhereInterface(
    compositeTarget: InterfaceEntityAdapter,
    whereArgs: Record<string, any>
): ConcreteEntityAdapter[] {
    if (!whereArgs || !whereArgs?._on || countSharedFilters(whereArgs) > 0) {
        return compositeTarget.concreteEntities;
    }

    return getMatchingConcreteEntity(compositeTarget, whereArgs._on);
}

function getConcreteEntitiesInOnArgumentOfWhereUnion(
    compositeTarget: UnionEntityAdapter,
    whereArgs: Record<string, any>
): ConcreteEntityAdapter[] {
    if (!whereArgs || countObjectKeys(whereArgs) === 0) {
        return compositeTarget.concreteEntities;
    }
    return getMatchingConcreteEntity(compositeTarget, whereArgs);
}

function getMatchingConcreteEntity(
    compositeTarget: UnionEntityAdapter | InterfaceEntityAdapter,
    whereArgs: Record<string, any>
): ConcreteEntityAdapter[] {
    const concreteEntities: ConcreteEntityAdapter[] = [];
    for (const concreteEntity of compositeTarget.concreteEntities) {
        if (whereArgs[concreteEntity.name]) {
            concreteEntities.push(concreteEntity);
        }
    }
    return concreteEntities;
}

function countObjectKeys(obj: Record<string, any>): number {
    return Object.keys(obj).length;
}

function countSharedFilters(whereArgs: Record<string, any>): number {
    return Object.entries(whereArgs).filter(([key]) => key !== "_on").length;
}
