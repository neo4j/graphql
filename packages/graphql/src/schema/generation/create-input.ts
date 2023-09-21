import type { DirectiveNode } from "graphql";
import type {
    Directive,
    InputTypeComposer,
    InputTypeComposerFieldConfigMapDefinition,
    SchemaComposer,
} from "graphql-compose";
import { RelationshipNestedOperationsOption } from "../../constants";
import { ConcreteEntityAdapter } from "../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import { InterfaceEntityAdapter } from "../../schema-model/entity/model-adapters/InterfaceEntityAdapter";
import { UnionEntityAdapter } from "../../schema-model/entity/model-adapters/UnionEntityAdapter";
import { RelationshipAdapter } from "../../schema-model/relationship/model-adapters/RelationshipAdapter";
import { createOnCreateITC2 } from "../create-relationship-fields/create-connect-or-create-field";
import { overwrite } from "../create-relationship-fields/fields/overwrite";
import { concreteEntityToCreateInputFields } from "../to-compose";
import { withAggregateInputType } from "./aggregate-types";
import { augmentWhereInputTypeWithRelationshipFields } from "./augment-where-input";
import { withConnectInputType } from "./connect-input";
import { withDeleteInputType } from "./delete-input";
import { withDisconnectInputType } from "./disconnect-input";
import { withUpdateInputType } from "./update-input";
import { makeConnectionWhereInputType } from "./where-input";

export function withCreateInputType({
    entityAdapter,
    userDefinedFieldDirectives,
    composer,
}: {
    entityAdapter: ConcreteEntityAdapter | InterfaceEntityAdapter | RelationshipAdapter;
    userDefinedFieldDirectives: Map<string, DirectiveNode[]>;
    composer: SchemaComposer;
}): InputTypeComposer {
    if (composer.has(entityAdapter.operations.createInputTypeName)) {
        return composer.getITC(entityAdapter.operations.createInputTypeName);
    }
    const createInputType = composer.createInputTC({
        name: entityAdapter.operations.createInputTypeName,
        fields: {},
    });

    if (entityAdapter instanceof ConcreteEntityAdapter || entityAdapter instanceof RelationshipAdapter) {
        createInputType.addFields(
            concreteEntityToCreateInputFields(entityAdapter.createInputFields, userDefinedFieldDirectives)
        );
    } else {
        createInputType.addFields(makeCreateInputFields(entityAdapter));
    }

    // ensureNonEmptyInput(composer, createInputType); - not for relationshipAdapter
    return createInputType;
}

function makeCreateInputFields(
    interfaceEntityAdapter: InterfaceEntityAdapter
): InputTypeComposerFieldConfigMapDefinition {
    const fields: InputTypeComposerFieldConfigMapDefinition = {};
    for (const entityAdapter of interfaceEntityAdapter.concreteEntities) {
        fields[entityAdapter.name] = {
            type: entityAdapter.operations.createInputTypeName,
        };
    }
    return fields;
}

export function augmentCreateInputTypeWithRelationshipsInput({
    relationshipAdapter,
    composer,
    userDefinedFieldDirectives,
    deprecatedDirectives,
}: {
    relationshipAdapter: RelationshipAdapter;
    composer: SchemaComposer;
    userDefinedFieldDirectives: Map<string, DirectiveNode[]>;
    deprecatedDirectives: Directive[];
}) {
    if (!relationshipAdapter.isCreatable()) {
        return;
    }
    if (relationshipAdapter.source instanceof InterfaceEntityAdapter) {
        // Interface CreateInput does not require relationship input fields
        // These are specified on the concrete nodes.
        return;
    }

    let relationshipsInput: InputTypeComposer | undefined;
    if (relationshipAdapter.target instanceof UnionEntityAdapter) {
        relationshipsInput = withUnionCreateInputType({ relationshipAdapter, composer, deprecatedDirectives });
    } else {
        relationshipsInput = withFieldInputType(relationshipAdapter, composer, userDefinedFieldDirectives);
    }
    if (!relationshipsInput) {
        return;
    }
    const createInput = withCreateInputType({
        entityAdapter: relationshipAdapter.source as ConcreteEntityAdapter,
        userDefinedFieldDirectives,
        composer,
    });

    if (!createInput) {
        return;
    }
    createInput.addFields({
        [relationshipAdapter.name]: {
            type: relationshipsInput,
            directives: deprecatedDirectives,
        },
    });
}

export function withUnionCreateInputType({
    relationshipAdapter,
    composer,
    deprecatedDirectives,
}: {
    relationshipAdapter: RelationshipAdapter;
    composer: SchemaComposer;
    deprecatedDirectives: Directive[];
}): InputTypeComposer | undefined {
    if (!(relationshipAdapter.target instanceof UnionEntityAdapter)) {
        throw new Error("Expected union target");
    }
    // if (!relationshipAdapter.shouldGenerateFieldInputType()) {
    //     return;
    // }
    const fields: InputTypeComposerFieldConfigMapDefinition = {};
    for (const memberEntity of relationshipAdapter.target.concreteEntities) {
        const fieldInput = withUnionFieldInputType(
            relationshipAdapter,
            memberEntity,
            composer,
            new Map<string, DirectiveNode[]>()
        );
        if (fieldInput) {
            fields[memberEntity.name] = {
                type: fieldInput,
                directives: deprecatedDirectives,
            };
        }
    }
    if (!Object.keys(fields).length) {
        return;
    }
    const createInput = composer.getOrCreateITC(relationshipAdapter.operations.unionCreateInputTypeName);
    createInput.addFields(fields);
    return createInput;
}

export function withUnionCreateFieldInputType({
    relationshipAdapter,
    composer,
    deprecatedDirectives,
}: {
    relationshipAdapter: RelationshipAdapter;
    composer: SchemaComposer;
    deprecatedDirectives: Directive[];
}): InputTypeComposer | undefined {
    if (!(relationshipAdapter.target instanceof UnionEntityAdapter)) {
        throw new Error("Expected union target");
    }
    const fields: InputTypeComposerFieldConfigMapDefinition = {};
    for (const memberEntity of relationshipAdapter.target.concreteEntities) {
        const fieldInput = withCreateFieldInputTypeU(
            relationshipAdapter,
            memberEntity,
            composer,
            new Map<string, DirectiveNode[]>()
        );
        if (fieldInput) {
            fields[memberEntity.name] = {
                type: relationshipAdapter.isList ? fieldInput.NonNull.List : fieldInput,
                directives: deprecatedDirectives,
            };
        }
    }
    if (!Object.keys(fields).length) {
        return;
    }
    const createInput = composer.getOrCreateITC(relationshipAdapter.operations.unionCreateFieldInputTypeName);
    createInput.addFields(fields);
    return createInput;
}

// ------------------- CONNECT OR CREATE ---------------
// TODO: refactor this
export function withConnectOrCreateFieldInputType(
    relationshipAdapter: RelationshipAdapter,
    composer: SchemaComposer,
    userDefinedFieldDirectives: Map<string, DirectiveNode[]>,
    ifUnionMemberEntity?: ConcreteEntityAdapter
): InputTypeComposer | undefined {
    if (!relationshipAdapter.nestedOperations.has(RelationshipNestedOperationsOption.CONNECT_OR_CREATE)) {
        return;
    }

    let targetEntity: ConcreteEntityAdapter | undefined;
    if (relationshipAdapter.target instanceof UnionEntityAdapter) {
        if (!ifUnionMemberEntity) {
            throw new Error("Expected member entity.");
        }
        targetEntity = ifUnionMemberEntity;
    } else {
        if (!(relationshipAdapter.target instanceof ConcreteEntityAdapter)) {
            throw new Error("Expected concrete target");
        }
        targetEntity = relationshipAdapter.target;
    }
    if (
        !relationshipAdapter.shouldGenerateFieldInputType(ifUnionMemberEntity) &&
        !relationshipAdapter.shouldGenerateUpdateFieldInputType(ifUnionMemberEntity)
    ) {
        return;
    }

    const hasUniqueFields = targetEntity.uniqueFields.length > 0;
    if (hasUniqueFields !== true) {
        return;
    }

    createOnCreateITC2({
        schemaComposer: composer,
        relationshipAdapter,
        targetEntityAdapter: targetEntity,
        userDefinedFieldDirectives,
    });

    composer.getOrCreateITC(targetEntity.operations.connectOrCreateWhereInputTypeName, (tc) => {
        tc.addFields((targetEntity as ConcreteEntityAdapter).operations.connectOrCreateWhereInputFieldNames);
    });

    const connectOrCreateName = relationshipAdapter.operations.getConnectOrCreateFieldInputTypeName(targetEntity);
    const connectOrCreateFieldInput = composer.getOrCreateITC(connectOrCreateName, (tc) => {
        tc.addFields(
            relationshipAdapter.operations.getConnectOrCreateInputFields(targetEntity as ConcreteEntityAdapter) || {}
        );
    });
    return connectOrCreateFieldInput;
}
export function withConnectOrCreateInputType(
    relationshipAdapter: RelationshipAdapter,
    composer: SchemaComposer,
    userDefinedFieldDirectives: Map<string, DirectiveNode[]>
): InputTypeComposer | undefined {
    if (relationshipAdapter.source instanceof UnionEntityAdapter) {
        throw new Error("Unexpected union source");
    }

    const fieldInput = withConnectOrCreateFieldInputType(relationshipAdapter, composer, userDefinedFieldDirectives);
    if (!fieldInput) {
        return;
    }

    const connectOrCreateInput = composer.getOrCreateITC(
        relationshipAdapter.source.operations.connectOrCreateInputTypeName
    );
    connectOrCreateInput.addFields({
        [relationshipAdapter.name]: relationshipAdapter.isList ? fieldInput.NonNull.List : fieldInput,
    });
    return connectOrCreateInput;
}
export function withConnectOrCreateInputTypeU(
    relationshipAdapter: RelationshipAdapter,
    composer: SchemaComposer,
    userDefinedFieldDirectives: Map<string, DirectiveNode[]>
): InputTypeComposer | undefined {
    if (relationshipAdapter.source instanceof UnionEntityAdapter) {
        throw new Error("Unexpected union source");
    }

    const fieldInput = withRelationshipConnectOrCreateInputType(
        relationshipAdapter,
        composer,
        userDefinedFieldDirectives
    );
    if (!fieldInput) {
        return;
    }

    const connectOrCreateInput = composer.getOrCreateITC(
        relationshipAdapter.source.operations.connectOrCreateInputTypeName
    );
    connectOrCreateInput.addFields({
        [relationshipAdapter.name]: fieldInput,
    });
    return connectOrCreateInput;
}
export function withRelationshipConnectOrCreateInputType(
    relationshipAdapter: RelationshipAdapter,
    composer: SchemaComposer,
    userDefinedFieldDirectives: Map<string, DirectiveNode[]>
): InputTypeComposer | undefined {
    if (!(relationshipAdapter.target instanceof UnionEntityAdapter)) {
        throw new Error("Expected union target");
    }

    const fields: InputTypeComposerFieldConfigMapDefinition = {};
    for (const memberEntity of relationshipAdapter.target.concreteEntities) {
        const fieldInput = withConnectOrCreateFieldInputType(
            relationshipAdapter,
            composer,
            userDefinedFieldDirectives,
            memberEntity
        );
        if (fieldInput) {
            fields[memberEntity.name] = relationshipAdapter.isList ? fieldInput.NonNull.List : fieldInput;
        }
    }

    if (!Object.keys(fields).length) {
        return;
    }

    const connectOrCreateInput = composer.getOrCreateITC(
        relationshipAdapter.operations.getConnectOrCreateInputTypeName()
    );
    connectOrCreateInput.addFields(fields);
    return connectOrCreateInput;
}

// ------------------- CREATE --------------------------
export function withCreateFieldInputType(
    relationshipAdapter: RelationshipAdapter,
    composer: SchemaComposer
): InputTypeComposer | undefined {
    if (!relationshipAdapter.nestedOperations.has(RelationshipNestedOperationsOption.CREATE)) {
        return;
    }
    if (
        !relationshipAdapter.shouldGenerateFieldInputType() &&
        !relationshipAdapter.shouldGenerateUpdateFieldInputType()
    ) {
        return;
    }
    if (!(relationshipAdapter.target instanceof ConcreteEntityAdapter)) {
        throw new Error("Expected concrete target");
    }
    const createName = relationshipAdapter.operations.getCreateFieldInputTypeName();
    const createFieldInput = composer.getOrCreateITC(createName, (tc) => {
        tc.addFields({
            node: `${(relationshipAdapter.target as ConcreteEntityAdapter).operations.createInputTypeName}!`,
        });
        const hasNonGeneratedProperties = relationshipAdapter.nonGeneratedProperties.length > 0;
        if (hasNonGeneratedProperties) {
            tc.addFields({
                edge: relationshipAdapter.operations.edgeCreateInputTypeName,
            });
        }
    });
    return createFieldInput;
}
export function withCreateFieldInputTypeU(
    relationshipAdapter: RelationshipAdapter,
    memberEntity: ConcreteEntityAdapter,
    composer: SchemaComposer,
    userDefinedFieldDirectives: Map<string, DirectiveNode[]>
): InputTypeComposer | undefined {
    if (!relationshipAdapter.nestedOperations.has(RelationshipNestedOperationsOption.CREATE)) {
        return;
    }
    if (!(relationshipAdapter.target instanceof UnionEntityAdapter)) {
        throw new Error("Expected union target");
    }
    const createName = relationshipAdapter.operations.getCreateFieldInputTypeName(memberEntity);
    const createFieldInput = composer.getOrCreateITC(createName, (tc) => {
        const createInputType = withCreateInputType({
            entityAdapter: memberEntity,
            userDefinedFieldDirectives,
            composer,
        });
        tc.addFields({
            node: createInputType.NonNull,
        });
        const hasNonGeneratedProperties = relationshipAdapter.nonGeneratedProperties.length > 0;
        if (hasNonGeneratedProperties) {
            tc.addFields({
                edge: relationshipAdapter.operations.edgeCreateInputTypeName,
            });
        }
    });
    return createFieldInput;
}
export function withCreateFieldInputTypeI(
    relationshipAdapter: RelationshipAdapter,
    composer: SchemaComposer,
    userDefinedFieldDirectives: Map<string, DirectiveNode[]>
): InputTypeComposer | undefined {
    if (!relationshipAdapter.nestedOperations.has(RelationshipNestedOperationsOption.CREATE)) {
        return;
    }
    if (!(relationshipAdapter.target instanceof InterfaceEntityAdapter)) {
        throw new Error("Expected concrete target");
    }
    const createName = relationshipAdapter.operations.getCreateFieldInputTypeName();
    const createFieldInput = composer.getOrCreateITC(createName, (tc) => {
        const createInputType = withCreateInputType({
            entityAdapter: relationshipAdapter.target as InterfaceEntityAdapter,
            userDefinedFieldDirectives,
            composer,
        });
        tc.addFields({
            node: createInputType.NonNull,
        });
        const hasNonGeneratedProperties = relationshipAdapter.nonGeneratedProperties.length > 0;
        if (hasNonGeneratedProperties) {
            tc.addFields({
                edge: relationshipAdapter.operations.edgeCreateInputTypeName,
            });
        }
    });
    return createFieldInput;
}

// ------------------- CONNECT --------------------------
export function withConnectFieldInputTypeI(
    relationshipAdapter: RelationshipAdapter,
    composer: SchemaComposer
): InputTypeComposer | undefined {
    if (!relationshipAdapter.nestedOperations.has(RelationshipNestedOperationsOption.CONNECT)) {
        return;
    }
    const relationshipTarget = relationshipAdapter.target;
    if (!(relationshipTarget instanceof InterfaceEntityAdapter)) {
        throw new Error("Unexpected");
    }
    const connectFieldInput = composer.getOrCreateITC(
        relationshipAdapter.operations.getConnectFieldInputTypeName(),
        (tc) => {
            tc.addFields({
                where: withConnectWhereFieldInputType(relationshipTarget, composer),
            });
            const connectInputType = withConnectInputType({ entityAdapter: relationshipTarget, composer });
            if (connectInputType) {
                tc.addFields({
                    connect: connectInputType,
                });
            }

            const hasNonGeneratedProperties = relationshipAdapter.nonGeneratedProperties.length > 0;
            if (hasNonGeneratedProperties) {
                tc.addFields({
                    edge: relationshipAdapter.operations.edgeCreateInputTypeName,
                });
            }
        }
    );
    return connectFieldInput;
}
export function withConnectFieldInputTypeU(
    relationshipAdapter: RelationshipAdapter,
    memberEntity: ConcreteEntityAdapter,
    composer: SchemaComposer
): InputTypeComposer | undefined {
    if (!relationshipAdapter.nestedOperations.has(RelationshipNestedOperationsOption.CONNECT)) {
        return;
    }
    const relationshipTarget = relationshipAdapter.target;
    if (!(relationshipTarget instanceof UnionEntityAdapter)) {
        throw new Error("Unexpected");
    }
    const connectFieldInput = composer.getOrCreateITC(
        relationshipAdapter.operations.getConnectFieldInputTypeName(memberEntity),
        (tc) => {
            tc.addFields({
                where: withConnectWhereFieldInputType(memberEntity, composer),
            });
            if (memberEntity.relationships.size) {
                const connectInputType = withConnectInputType({ entityAdapter: memberEntity, composer });
                if (connectInputType) {
                    tc.addFields({
                        connect: relationshipAdapter.isList ? connectInputType.NonNull.List : connectInputType,
                    });
                }
            }

            const hasNonGeneratedProperties = relationshipAdapter.nonGeneratedProperties.length > 0;
            if (hasNonGeneratedProperties) {
                tc.addFields({
                    edge: relationshipAdapter.operations.edgeCreateInputTypeName,
                });
            }
        }
    );
    return connectFieldInput;
}
export function withConnectFieldInputType(
    relationshipAdapter: RelationshipAdapter,
    composer: SchemaComposer
): InputTypeComposer | undefined {
    if (!relationshipAdapter.nestedOperations.has(RelationshipNestedOperationsOption.CONNECT)) {
        return;
    }
    if (
        !relationshipAdapter.shouldGenerateFieldInputType() &&
        !relationshipAdapter.shouldGenerateUpdateFieldInputType()
    ) {
        return;
    }
    const relationshipTarget = relationshipAdapter.target;
    if (relationshipTarget instanceof UnionEntityAdapter) {
        throw new Error("Unexpected");
    }
    const connectFieldInput = composer.getOrCreateITC(
        relationshipAdapter.operations.getConnectFieldInputTypeName(),
        (tc) => {
            tc.addFields({
                where: withConnectWhereFieldInputType(relationshipTarget, composer),
            });
            if (
                relationshipTargetHasRelationshipWithNestedOperation(
                    relationshipTarget,
                    RelationshipNestedOperationsOption.CONNECT
                )
            ) {
                tc.addFields({
                    connect: relationshipAdapter.isList
                        ? `[${relationshipTarget.operations.connectInputTypeName}!]`
                        : relationshipTarget.operations.connectInputTypeName,
                });
            }

            const hasNonGeneratedProperties = relationshipAdapter.nonGeneratedProperties.length > 0;
            if (hasNonGeneratedProperties) {
                tc.addFields({
                    edge: relationshipAdapter.operations.edgeCreateInputTypeName,
                });
            }

            tc.addFields({ overwrite });
            tc.makeFieldNonNull("overwrite");
        }
    );
    return connectFieldInput;
}

function withConnectWhereFieldInputType(
    relationshipTarget: ConcreteEntityAdapter | InterfaceEntityAdapter,
    composer: SchemaComposer
): InputTypeComposer {
    const connectWhereName = relationshipTarget.operations.connectWhereInputTypeName;
    if (composer.has(connectWhereName)) {
        return composer.getITC(connectWhereName);
    }
    const connectWhereType = composer.getOrCreateITC(connectWhereName, (tc) => {
        tc.addFields({ node: `${relationshipTarget.operations.whereInputTypeName}!` });
    });
    return connectWhereType;
}

function relationshipTargetHasRelationshipWithNestedOperation(
    target: ConcreteEntityAdapter | InterfaceEntityAdapter,
    nestedOperation: RelationshipNestedOperationsOption
): boolean {
    return Array.from(target.relationships.values()).some((rel) => rel.nestedOperations.has(nestedOperation));
}

// ------------------- DISCONNECT --------------------------
export function withDisconnectFieldInputType(
    relationshipAdapter: RelationshipAdapter,
    composer: SchemaComposer
): InputTypeComposer | undefined {
    if (!relationshipAdapter.nestedOperations.has(RelationshipNestedOperationsOption.DISCONNECT)) {
        return;
    }
    if (!relationshipAdapter.shouldGenerateUpdateFieldInputType()) {
        return;
    }
    const relationshipTarget = relationshipAdapter.target;
    if (!(relationshipTarget instanceof ConcreteEntityAdapter)) {
        throw new Error("Expected concrete target");
    }
    const disconnectFieldInput = composer.getOrCreateITC(
        relationshipAdapter.operations.getDisconnectFieldInputTypeName(),
        (tc) => {
            tc.addFields({
                where: relationshipAdapter.operations.getConnectionWhereTypename(),
            });
            if (
                relationshipTargetHasRelationshipWithNestedOperation(
                    relationshipTarget,
                    RelationshipNestedOperationsOption.DISCONNECT
                )
            ) {
                tc.addFields({
                    disconnect: relationshipTarget.operations.disconnectInputTypeName,
                });
            }
        }
    );
    return disconnectFieldInput;
}
export function withDisconnectFieldInputTypeU(
    relationshipAdapter: RelationshipAdapter,
    memberEntity: ConcreteEntityAdapter,
    composer: SchemaComposer
): InputTypeComposer | undefined {
    if (!relationshipAdapter.nestedOperations.has(RelationshipNestedOperationsOption.DISCONNECT)) {
        return;
    }
    const relationshipTarget = relationshipAdapter.target;
    if (!(relationshipTarget instanceof UnionEntityAdapter)) {
        throw new Error("Expected union target");
    }
    const disconnectFieldInput = composer.getOrCreateITC(
        relationshipAdapter.operations.getDisconnectFieldInputTypeName(memberEntity),
        (tc) => {
            tc.addFields({
                where: makeConnectionWhereInputType({ relationshipAdapter, memberEntity, composer }),
            });
            if (memberEntity.relationships.size) {
                const disconnectInputType = withDisconnectInputType({
                    entityAdapter: memberEntity,
                    composer,
                });
                if (disconnectInputType) {
                    tc.addFields({
                        disconnect: memberEntity.operations.disconnectInputTypeName,
                    });
                }
            }
        }
    );
    return disconnectFieldInput;
}
export function withDisconnectFieldInputTypeI(
    relationshipAdapter: RelationshipAdapter,
    composer: SchemaComposer
): InputTypeComposer | undefined {
    if (!relationshipAdapter.nestedOperations.has(RelationshipNestedOperationsOption.DISCONNECT)) {
        return;
    }
    const relationshipTarget = relationshipAdapter.target;
    if (!(relationshipTarget instanceof InterfaceEntityAdapter)) {
        throw new Error("Expected interface target");
    }
    const disconnectFieldInput = composer.getOrCreateITC(
        relationshipAdapter.operations.getDisconnectFieldInputTypeName(),
        (tc) => {
            tc.addFields({
                where: relationshipAdapter.operations.getConnectionWhereTypename(),
            });
            const disconnectInputType = withDisconnectInputType({
                entityAdapter: relationshipTarget,
                composer,
            });
            if (disconnectInputType) {
                tc.addFields({
                    disconnect: relationshipTarget.operations.disconnectInputTypeName,
                });
            }
        }
    );
    return disconnectFieldInput;
}

// ------------------- DELETE --------------------------
export function withDeleteFieldInputType(
    relationshipAdapter: RelationshipAdapter,
    composer: SchemaComposer
): InputTypeComposer | undefined {
    if (!relationshipAdapter.nestedOperations.has(RelationshipNestedOperationsOption.DELETE)) {
        return;
    }
    if (!relationshipAdapter.shouldGenerateUpdateFieldInputType()) {
        return;
    }
    const relationshipTarget = relationshipAdapter.target;
    if (!(relationshipTarget instanceof ConcreteEntityAdapter)) {
        throw new Error("Expected concrete target");
    }
    const deleteFieldInput = composer.getOrCreateITC(
        relationshipAdapter.operations.getDeleteFieldInputTypeName(),
        (tc) => {
            tc.addFields({
                where: relationshipAdapter.operations.getConnectionWhereTypename(),
            });
            if (
                relationshipTargetHasRelationshipWithNestedOperation(
                    relationshipTarget,
                    RelationshipNestedOperationsOption.DELETE
                )
            ) {
                tc.addFields({
                    delete: relationshipTarget.operations.deleteInputTypeName,
                });
            }
        }
    );
    return deleteFieldInput;
}
export function withDeleteFieldInputTypeU(
    relationshipAdapter: RelationshipAdapter,
    memberEntity: ConcreteEntityAdapter,
    composer: SchemaComposer
): InputTypeComposer | undefined {
    if (!relationshipAdapter.nestedOperations.has(RelationshipNestedOperationsOption.DELETE)) {
        return;
    }
    const relationshipTarget = relationshipAdapter.target;
    if (!(relationshipTarget instanceof UnionEntityAdapter)) {
        throw new Error("Expected union target");
    }
    const deleteFieldInput = composer.getOrCreateITC(
        relationshipAdapter.operations.getDeleteFieldInputTypeName(memberEntity),
        (tc) => {
            tc.addFields({
                where: makeConnectionWhereInputType({ relationshipAdapter, memberEntity, composer }),
            });
            if (memberEntity.relationships.size) {
                const deleteInputType = withDeleteInputType({ entityAdapter: memberEntity, composer });
                if (deleteInputType) {
                    tc.addFields({
                        delete: memberEntity.operations.deleteInputTypeName,
                    });
                }
            }
        }
    );
    return deleteFieldInput;
}
export function withDeleteFieldInputTypeI(
    relationshipAdapter: RelationshipAdapter,
    composer: SchemaComposer
): InputTypeComposer | undefined {
    if (!relationshipAdapter.nestedOperations.has(RelationshipNestedOperationsOption.DELETE)) {
        return;
    }
    const relationshipTarget = relationshipAdapter.target;
    if (!(relationshipTarget instanceof InterfaceEntityAdapter)) {
        throw new Error("Expected interface target");
    }
    const deleteFieldInput = composer.getOrCreateITC(
        relationshipAdapter.operations.getDeleteFieldInputTypeName(),
        (tc) => {
            tc.addFields({
                where: relationshipAdapter.operations.getConnectionWhereTypename(),
            });
            const deleteInputType = withDeleteInputType({ entityAdapter: relationshipTarget, composer });
            if (deleteInputType) {
                tc.addFields({
                    delete: relationshipTarget.operations.deleteInputTypeName,
                });
            }
        }
    );
    return deleteFieldInput;
}

// ------------------- UPDATE --------------------------
export function withUpdateConnectionFieldInputType(
    relationshipAdapter: RelationshipAdapter,
    composer: SchemaComposer
): InputTypeComposer | undefined {
    if (!relationshipAdapter.isUpdatable()) {
        return;
    }
    if (!relationshipAdapter.shouldGenerateUpdateFieldInputType()) {
        return;
    }
    const relationshipTarget = relationshipAdapter.target;
    if (!(relationshipTarget instanceof ConcreteEntityAdapter)) {
        throw new Error("Expected concrete target");
    }
    const updateFieldInput = composer.getOrCreateITC(
        relationshipAdapter.operations.getUpdateConnectionInputTypename(),
        (tc) => {
            tc.addFields({
                node: relationshipTarget.operations.updateInputTypeName,
            });
            const hasNonGeneratedProperties = relationshipAdapter.nonGeneratedProperties.length > 0;
            if (hasNonGeneratedProperties) {
                tc.addFields({ edge: relationshipAdapter.operations.edgeUpdateInputTypeName });
            }
        }
    );
    return updateFieldInput;
}
export function withUpdateConnectionFieldInputTypeU(
    relationshipAdapter: RelationshipAdapter,
    memberEntity: ConcreteEntityAdapter,
    composer: SchemaComposer,
    userDefinedFieldDirectives: Map<string, DirectiveNode[]>
): InputTypeComposer | undefined {
    // TODO: should this be checked in withUpdateFieldInputTypeU update instead?
    if (!relationshipAdapter.nestedOperations.has(RelationshipNestedOperationsOption.UPDATE)) {
        return;
    }

    const relationshipTarget = relationshipAdapter.target;
    if (!(relationshipTarget instanceof UnionEntityAdapter)) {
        throw new Error("Expected union target");
    }
    const updateFieldInput = composer.getOrCreateITC(
        relationshipAdapter.operations.getUpdateConnectionInputTypename(memberEntity),
        (tc) => {
            const updateInputType = withUpdateInputType({
                entityAdapter: memberEntity,
                userDefinedFieldDirectives,
                composer,
            });
            tc.addFields({
                node: updateInputType,
            });
            const hasNonGeneratedProperties = relationshipAdapter.nonGeneratedProperties.length > 0;
            if (hasNonGeneratedProperties) {
                tc.addFields({ edge: relationshipAdapter.operations.edgeUpdateInputTypeName });
            }
        }
    );
    return updateFieldInput;
}
export function withUpdateConnectionFieldInputTypeI(
    relationshipAdapter: RelationshipAdapter,
    composer: SchemaComposer,
    userDefinedFieldDirectives: Map<string, DirectiveNode[]>
): InputTypeComposer | undefined {
    if (!relationshipAdapter.nestedOperations.has(RelationshipNestedOperationsOption.UPDATE)) {
        return;
    }

    const relationshipTarget = relationshipAdapter.target;
    if (!(relationshipTarget instanceof InterfaceEntityAdapter)) {
        throw new Error("Expected concrete target");
    }
    const updateFieldInput = composer.getOrCreateITC(
        relationshipAdapter.operations.getUpdateConnectionInputTypename(),
        (tc) => {
            const updateInputType = withUpdateInputType({
                entityAdapter: relationshipAdapter.target as InterfaceEntityAdapter,
                userDefinedFieldDirectives,
                composer,
            });
            tc.addFields({
                node: updateInputType,
            });
            const hasNonGeneratedProperties = relationshipAdapter.nonGeneratedProperties.length > 0;
            if (hasNonGeneratedProperties) {
                tc.addFields({ edge: relationshipAdapter.operations.edgeUpdateInputTypeName });
            }
        }
    );
    return updateFieldInput;
}

export function withUpdateFieldInputType(
    relationshipAdapter: RelationshipAdapter,
    composer: SchemaComposer,
    userDefinedFieldDirectives: Map<string, DirectiveNode[]>
): InputTypeComposer | undefined {
    if (!relationshipAdapter.shouldGenerateUpdateFieldInputType()) {
        return;
    }
    if (!relationshipAdapter.isUpdatable()) {
        return;
    }
    const relationshipTarget = relationshipAdapter.target;
    if (!(relationshipTarget instanceof ConcreteEntityAdapter)) {
        throw new Error("Expected concrete target");
    }
    const updateFieldInput = composer.getOrCreateITC(
        relationshipAdapter.operations.getUpdateFieldInputTypeName(),
        (tc) => {
            const connectFieldInputType = withConnectFieldInputType(relationshipAdapter, composer);
            if (connectFieldInputType) {
                tc.addFields({
                    connect: {
                        type: relationshipAdapter.isList ? connectFieldInputType.NonNull.List : connectFieldInputType,
                        directives: [],
                    },
                });
            }
            const deleteFieldInputType = withDeleteFieldInputType(relationshipAdapter, composer);
            if (deleteFieldInputType) {
                tc.addFields({
                    delete: {
                        type: relationshipAdapter.isList ? deleteFieldInputType.NonNull.List : deleteFieldInputType,
                        directives: [],
                    },
                });
            }
            const disconnectFieldInputType = withDisconnectFieldInputType(relationshipAdapter, composer);
            if (disconnectFieldInputType) {
                tc.addFields({
                    disconnect: {
                        type: relationshipAdapter.isList
                            ? disconnectFieldInputType.NonNull.List
                            : disconnectFieldInputType,
                        directives: [],
                    },
                });
            }
            const createFieldInputType = withCreateFieldInputType(relationshipAdapter, composer);
            if (createFieldInputType) {
                tc.addFields({
                    create: {
                        type: relationshipAdapter.isList ? createFieldInputType.NonNull.List : createFieldInputType,
                        directives: [],
                    },
                });
            }
            if (relationshipAdapter.nestedOperations.has(RelationshipNestedOperationsOption.UPDATE)) {
                const updateFieldInputType = withUpdateConnectionFieldInputType(relationshipAdapter, composer);
                if (updateFieldInputType) {
                    tc.addFields({
                        update: {
                            type: updateFieldInputType,
                            directives: [],
                        },
                    });
                }
            }

            // TODO: where is this coming from?
            tc.addFields({
                where: relationshipAdapter.operations.getConnectionWhereTypename(),
            });
            const connectOrCreateFieldInputType = withConnectOrCreateFieldInputType(
                relationshipAdapter,
                composer,
                userDefinedFieldDirectives
            );
            if (connectOrCreateFieldInputType) {
                tc.addFields({
                    connectOrCreate: {
                        type: relationshipAdapter.isList
                            ? connectOrCreateFieldInputType.NonNull.List
                            : connectOrCreateFieldInputType,
                        directives: [],
                    },
                });
            }
        }
    );
    return updateFieldInput;
}
export function withUpdateFieldInputTypeU(
    relationshipAdapter: RelationshipAdapter,
    memberEntity: ConcreteEntityAdapter,
    composer: SchemaComposer,
    userDefinedFieldDirectives: Map<string, DirectiveNode[]>
): InputTypeComposer | undefined {
    if (!relationshipAdapter.shouldGenerateUpdateFieldInputType(memberEntity)) {
        return;
    }
    if (!relationshipAdapter.isUpdatable()) {
        return;
    }
    const relationshipTarget = relationshipAdapter.target;
    if (!(relationshipTarget instanceof UnionEntityAdapter)) {
        throw new Error("Expected union target");
    }
    const updateFieldInput = composer.getOrCreateITC(
        relationshipAdapter.operations.getUpdateFieldInputTypeName(memberEntity),
        (tc) => {
            const connectFieldInputType = withConnectFieldInputTypeU(relationshipAdapter, memberEntity, composer);
            if (connectFieldInputType) {
                tc.addFields({
                    connect: {
                        type: relationshipAdapter.isList ? connectFieldInputType.NonNull.List : connectFieldInputType,
                        directives: [],
                    },
                });
            }
            const deleteFieldInputType = withDeleteFieldInputTypeU(relationshipAdapter, memberEntity, composer);
            if (deleteFieldInputType) {
                tc.addFields({
                    delete: {
                        type: relationshipAdapter.isList ? deleteFieldInputType.NonNull.List : deleteFieldInputType,
                        directives: [],
                    },
                });
            }
            const disconnectFieldInputType = withDisconnectFieldInputTypeU(relationshipAdapter, memberEntity, composer);
            if (disconnectFieldInputType) {
                tc.addFields({
                    disconnect: {
                        type: relationshipAdapter.isList
                            ? disconnectFieldInputType.NonNull.List
                            : disconnectFieldInputType,
                        directives: [],
                    },
                });
            }
            const createFieldInputType = withCreateFieldInputTypeU(
                relationshipAdapter,
                memberEntity,
                composer,
                userDefinedFieldDirectives
            );
            if (createFieldInputType) {
                tc.addFields({
                    create: {
                        type: relationshipAdapter.isList ? createFieldInputType.NonNull.List : createFieldInputType,
                        directives: [],
                    },
                });
            }
            const connectOrCreateFieldInputType = withConnectOrCreateFieldInputType(
                relationshipAdapter,
                composer,
                userDefinedFieldDirectives,
                memberEntity
            );
            if (connectOrCreateFieldInputType) {
                tc.addFields({
                    connectOrCreate: {
                        type: relationshipAdapter.isList
                            ? connectOrCreateFieldInputType.NonNull.List
                            : connectOrCreateFieldInputType,
                        directives: [],
                    },
                });
            }
            const updateFieldInputType = withUpdateConnectionFieldInputTypeU(
                relationshipAdapter,
                memberEntity,
                composer,
                userDefinedFieldDirectives
            );
            if (updateFieldInputType) {
                tc.addFields({
                    update: {
                        type: updateFieldInputType,
                        directives: [],
                    },
                });
            }
            tc.addFields({
                where: makeConnectionWhereInputType({ relationshipAdapter, memberEntity, composer }),
            });
        }
    );
    return updateFieldInput;
}
export function withUpdateFieldInputTypeI(
    relationshipAdapter: RelationshipAdapter,
    composer: SchemaComposer,
    userDefinedFieldDirectives: Map<string, DirectiveNode[]>
): InputTypeComposer | undefined {
    // TODO: make these fit somehow
    // if (!relationshipAdapter.shouldGenerateUpdateFieldInputType()) {
    //     return;
    // }
    if (
        relationshipAdapter.nestedOperations.size === 0 ||
        (relationshipAdapter.nestedOperations.size === 1 &&
            relationshipAdapter.nestedOperations.has(RelationshipNestedOperationsOption.CONNECT_OR_CREATE))
    ) {
        return;
    }
    if (!relationshipAdapter.isUpdatable()) {
        return;
    }
    const relationshipTarget = relationshipAdapter.target;
    if (!(relationshipTarget instanceof InterfaceEntityAdapter)) {
        throw new Error("Expected concrete target");
    }
    const updateFieldInput = composer.getOrCreateITC(
        relationshipAdapter.operations.getUpdateFieldInputTypeName(),
        (tc) => {
            const connectFieldInputType = withConnectFieldInputTypeI(relationshipAdapter, composer);
            if (connectFieldInputType) {
                tc.addFields({
                    connect: {
                        type: relationshipAdapter.isList ? connectFieldInputType.NonNull.List : connectFieldInputType,
                        directives: [],
                    },
                });
            }
            const deleteFieldInputType = withDeleteFieldInputTypeI(relationshipAdapter, composer);
            if (deleteFieldInputType) {
                tc.addFields({
                    delete: {
                        type: relationshipAdapter.isList ? deleteFieldInputType.NonNull.List : deleteFieldInputType,
                        directives: [],
                    },
                });
            }
            const disconnectFieldInputType = withDisconnectFieldInputTypeI(relationshipAdapter, composer);
            if (disconnectFieldInputType) {
                tc.addFields({
                    disconnect: {
                        type: relationshipAdapter.isList
                            ? disconnectFieldInputType.NonNull.List
                            : disconnectFieldInputType,
                        directives: [],
                    },
                });
            }
            const createFieldInputType = withCreateFieldInputTypeI(
                relationshipAdapter,
                composer,
                userDefinedFieldDirectives
            );
            if (createFieldInputType) {
                tc.addFields({
                    create: {
                        type: relationshipAdapter.isList ? createFieldInputType.NonNull.List : createFieldInputType,
                        directives: [],
                    },
                });
            }
            const updateFieldInputType = withUpdateConnectionFieldInputTypeI(
                relationshipAdapter,
                composer,
                userDefinedFieldDirectives
            );
            if (updateFieldInputType) {
                tc.addFields({
                    update: {
                        type: updateFieldInputType,
                        directives: [],
                    },
                });
            }
            // TODO: where is this coming from?
            tc.addFields({
                where: relationshipAdapter.operations.getConnectionWhereTypename(),
            });
        }
    );
    return updateFieldInput;
}

// -------------------- FIELD INPUT ------------------------
export function withFieldInputType(
    relationshipAdapter: RelationshipAdapter,
    composer: SchemaComposer,
    userDefinedFieldDirectives: Map<string, DirectiveNode[]>
): InputTypeComposer | undefined {
    if (composer.has(relationshipAdapter.operations.getFieldInputTypeName())) {
        return composer.getITC(relationshipAdapter.operations.getFieldInputTypeName());
    }
    if (!relationshipAdapter.shouldGenerateFieldInputType()) {
        return;
    }
    const relationshipTarget = relationshipAdapter.target;
    if (relationshipTarget instanceof UnionEntityAdapter) {
        throw new Error("Unexpected union target");
    }
    const fields = makeFieldInputTypeFields(relationshipAdapter, composer, userDefinedFieldDirectives);
    if (!Object.keys(fields).length) {
        return;
    }
    const fieldInput = composer.getOrCreateITC(relationshipAdapter.operations.getFieldInputTypeName(), (tc) => {
        tc.addFields(fields);
    });
    return fieldInput;
}

export function withUnionFieldInputType(
    relationshipAdapter: RelationshipAdapter,
    memberEntity: ConcreteEntityAdapter,
    composer: SchemaComposer,
    userDefinedFieldDirectives: Map<string, DirectiveNode[]>
): InputTypeComposer | undefined {
    if (composer.has(relationshipAdapter.operations.getFieldInputTypeName(memberEntity))) {
        return composer.getITC(relationshipAdapter.operations.getFieldInputTypeName(memberEntity));
    }
    if (!relationshipAdapter.shouldGenerateFieldInputType(memberEntity)) {
        return;
    }
    const relationshipTarget = relationshipAdapter.target;
    if (!(relationshipTarget instanceof UnionEntityAdapter)) {
        throw new Error("Expected union target");
    }
    const fields = makeFieldInputTypeFields(relationshipAdapter, composer, userDefinedFieldDirectives, memberEntity);
    if (!Object.keys(fields).length) {
        return;
    }
    const fieldInput = composer.getOrCreateITC(
        relationshipAdapter.operations.getFieldInputTypeName(memberEntity),
        (tc) => {
            tc.addFields(fields);
        }
    );
    return fieldInput;
}

export function makeFieldInputTypeFields(
    relationshipAdapter: RelationshipAdapter,
    composer: SchemaComposer,
    userDefinedFieldDirectives: Map<string, DirectiveNode[]>,
    ifUnionMemberEntity?: ConcreteEntityAdapter
): InputTypeComposerFieldConfigMapDefinition {
    const fields = {};
    let connectFieldInputType: InputTypeComposer | undefined;
    let createFieldInputType: InputTypeComposer | undefined;
    let connectOrCreateFieldInputType: InputTypeComposer | undefined;
    const relationshipTarget = relationshipAdapter.target;
    if (relationshipTarget instanceof ConcreteEntityAdapter) {
        connectFieldInputType = withConnectFieldInputType(relationshipAdapter, composer);
        createFieldInputType = withCreateFieldInputType(relationshipAdapter, composer);
        connectOrCreateFieldInputType = withConnectOrCreateFieldInputType(
            relationshipAdapter,
            composer,
            userDefinedFieldDirectives
        );
    } else if (relationshipTarget instanceof InterfaceEntityAdapter) {
        connectFieldInputType = withConnectFieldInputTypeI(relationshipAdapter, composer);
        createFieldInputType = withCreateFieldInputTypeI(relationshipAdapter, composer, userDefinedFieldDirectives);
    } else {
        if (!ifUnionMemberEntity) {
            throw new Error("Member Entity required.");
        }
        connectFieldInputType = withConnectFieldInputTypeU(relationshipAdapter, ifUnionMemberEntity, composer);
        createFieldInputType = withCreateFieldInputTypeU(
            relationshipAdapter,
            ifUnionMemberEntity,
            composer,
            userDefinedFieldDirectives
        );
        connectOrCreateFieldInputType = withConnectOrCreateFieldInputType(
            relationshipAdapter,
            composer,
            userDefinedFieldDirectives,
            ifUnionMemberEntity
        );
    }
    if (connectFieldInputType) {
        fields["connect"] = {
            type: relationshipAdapter.isList ? connectFieldInputType.NonNull.List : connectFieldInputType,
            directives: [],
        };
    }
    if (createFieldInputType) {
        fields["create"] = {
            type: relationshipAdapter.isList ? createFieldInputType.NonNull.List : createFieldInputType,
            directives: [],
        };
    }
    if (connectOrCreateFieldInputType) {
        fields["connectOrCreate"] = {
            type: relationshipAdapter.isList
                ? connectOrCreateFieldInputType.NonNull.List
                : connectOrCreateFieldInputType,
            directives: [],
        };
    }
    return fields;
}

// -------------------- RELATION INPUT ------------------------
export function withRelationInputType(
    relationshipAdapter: RelationshipAdapter,
    composer: SchemaComposer,
    deprecatedDirectives: Directive[],
    userDefinedFieldDirectives: Map<string, DirectiveNode[]>
): InputTypeComposer | undefined {
    const relationshipSource = relationshipAdapter.source;
    if (relationshipSource instanceof UnionEntityAdapter) {
        throw new Error("Unexpected union source");
    }
    let createFieldInputType: InputTypeComposer | undefined;
    if (relationshipAdapter.target instanceof ConcreteEntityAdapter) {
        createFieldInputType = withCreateFieldInputType(relationshipAdapter, composer);
    } else if (relationshipAdapter.target instanceof InterfaceEntityAdapter) {
        createFieldInputType = withCreateFieldInputTypeI(relationshipAdapter, composer, userDefinedFieldDirectives);
    }
    if (!createFieldInputType) {
        return;
    }

    const relationInput = composer.getOrCreateITC(relationshipSource.operations.relationInputTypeName);
    if (createFieldInputType) {
        relationInput.addFields({
            [relationshipAdapter.name]: {
                type: relationshipAdapter.isList ? createFieldInputType.NonNull.List : createFieldInputType,
                directives: deprecatedDirectives,
            },
        });
    }

    return relationInput;
}

export function withUnionRelationInputType({
    relationshipAdapter,
    composer,
    deprecatedDirectives,
}: {
    relationshipAdapter: RelationshipAdapter;
    composer: SchemaComposer;
    deprecatedDirectives: Directive[];
}): InputTypeComposer | undefined {
    if (!relationshipAdapter.nestedOperations.has(RelationshipNestedOperationsOption.CREATE)) {
        return;
    }
    const relationshipSource = relationshipAdapter.source;
    if (relationshipSource instanceof UnionEntityAdapter) {
        throw new Error("Unexpected union source");
    }
    let createFieldInputType: InputTypeComposer | undefined;
    if (relationshipAdapter.target instanceof UnionEntityAdapter) {
        createFieldInputType = withUnionCreateFieldInputType({ relationshipAdapter, composer, deprecatedDirectives });
    }
    if (!createFieldInputType) {
        return;
    }

    const relationInput = composer.getOrCreateITC(relationshipSource.operations.relationInputTypeName);
    if (createFieldInputType) {
        relationInput.addFields({
            [relationshipAdapter.name]: {
                type: createFieldInputType,
                directives: deprecatedDirectives,
            },
        });
    }

    return relationInput;
}

// -------------------- WHERE INPUT ------------------------
export function withSourceWhereInputType(
    relationshipAdapter: RelationshipAdapter,
    composer: SchemaComposer,
    deprecatedDirectives: Directive[]
): InputTypeComposer | undefined {
    const relationshipTarget = relationshipAdapter.target;
    if (!(relationshipTarget instanceof ConcreteEntityAdapter)) {
        throw new Error("Expected concrete target");
    }
    const relationshipSource = relationshipAdapter.source;
    if (relationshipSource instanceof UnionEntityAdapter) {
        throw new Error("Unexpected union source");
    }
    const whereInput = composer.getITC(relationshipSource.operations.whereInputTypeName);
    const fields = augmentWhereInputTypeWithRelationshipFields(
        relationshipSource,
        relationshipAdapter,
        deprecatedDirectives
    );
    whereInput.addFields(fields);

    const whereAggregateInput = withAggregateInputType({
        relationshipAdapter,
        entityAdapter: relationshipTarget,
        composer: composer,
    });
    if (relationshipAdapter.isFilterableByAggregate()) {
        whereInput.addFields({
            [relationshipAdapter.operations.aggregateTypeName]: {
                type: whereAggregateInput,
                directives: deprecatedDirectives,
            },
        });
    }

    return whereInput;
}
