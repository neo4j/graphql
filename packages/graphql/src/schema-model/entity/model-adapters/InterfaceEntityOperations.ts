/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { ImplementingEntityOperations } from "./ImplementingEntityOperations";
import type { InterfaceEntityAdapter } from "./InterfaceEntityAdapter";

export class InterfaceEntityOperations extends ImplementingEntityOperations<InterfaceEntityAdapter> {
    constructor(interfaceEntityAdapter: InterfaceEntityAdapter) {
        super(interfaceEntityAdapter);
    }

    public get implementationEnumTypename(): string {
        return `${this.entityAdapter.name}Implementation`;
    }

    public get implementationsSubscriptionWhereInputTypeName(): string {
        return `${this.entityAdapter.name}ImplementationsSubscriptionWhere`;
    }

    public get connectionFieldTypename(): string {
        return `${this.pascalCasePlural}Connection`;
    }
}
