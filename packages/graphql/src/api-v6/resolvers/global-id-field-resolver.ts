import type { GraphQLResolveInfo } from "graphql";
import type { ConcreteEntity } from "../../schema-model/entity/ConcreteEntity";
import type { ConnectionQueryArgs } from "../../types";
import { toGlobalId } from "../../utils/global-ids";

/** Maps the database id to globalId*/
export function generateGlobalIdFieldResolver({ entity }: { entity: ConcreteEntity }) {
    return function resolve(source, _args: ConnectionQueryArgs, _ctx, _info: GraphQLResolveInfo) {
        const globalAttribute = entity.globalIdField;
        if (!globalAttribute) {
            throw new Error("Global Id Field not found");
        }

        const field = globalAttribute.name;
        const value = source[field] as string | number;

        const globalId = toGlobalId({
            typeName: entity.name,
            field,
            id: value,
        });
        return globalId;
    };
}
