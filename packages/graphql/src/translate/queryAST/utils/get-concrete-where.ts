import type { ConcreteEntityAdapter } from "../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { InterfaceEntityAdapter } from "../../../schema-model/entity/model-adapters/InterfaceEntityAdapter";
import type { UnionEntityAdapter } from "../../../schema-model/entity/model-adapters/UnionEntityAdapter";
import { isUnionEntity } from "./is-union-entity";

/**
 *  Given a Record<string, any> representing a where argument for a composite target fields returns its concrete where argument.
    For instance, given:
    {
        Genre: { name: "Horror" },
        Movie: { title: "The Matrix" }
    } 
    Returns { name: "Horror" } if the concreteTarget is Genre.
**/
export function getConcreteWhere(
    whereArgs: Record<string, any>,
    compositeTarget: UnionEntityAdapter | InterfaceEntityAdapter,
    concreteTarget: ConcreteEntityAdapter
): Record<string, any> {
    if (whereArgs) {
        if (isUnionEntity(compositeTarget)) {
            return whereArgs[concreteTarget.name] ?? {};
        } else {
            // interface may have shared filters, inject them as if they were present under _on
            const sharedInterfaceFilters = Object.entries(whereArgs).filter(([key]) => key !== "_on");

            return whereArgs["_on"]
                ? { ...Object.fromEntries(sharedInterfaceFilters), ...whereArgs["_on"][concreteTarget.name] }
                : Object.fromEntries(sharedInterfaceFilters);
        }
    }
    return {};
}

