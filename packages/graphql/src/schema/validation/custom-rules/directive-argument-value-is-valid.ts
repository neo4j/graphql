/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 *
 * This file is part of Neo4j.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type {
    ASTVisitor,
    DirectiveNode,
    ASTNode,
    ObjectTypeDefinitionNode,
    FieldDefinitionNode,
    TypeNode,
    ValueNode,
    EnumTypeDefinitionNode,
    StringValueNode,
    ObjectFieldNode,
    InterfaceTypeDefinitionNode,
    UnionTypeDefinitionNode,
} from "graphql";
import { Kind, parse, GraphQLError } from "graphql";
import * as neo4j from "neo4j-driver";
import type { SDLValidationContext } from "graphql/validation/ValidationContext";
import parseValueNode from "../../../schema-model/parser/parse-value-node";
import type { FulltextIndex, Neo4jGraphQLCallbacks } from "../../../types";
import type { IResolvers } from "@graphql-tools/utils";
import { asArray } from "../../../utils/utils";

export function DirectiveArgumentValueValid(
    userCustomResolvers?: IResolvers | IResolvers[],
    extra?: {
        enums: EnumTypeDefinitionNode[];
        interfaces: InterfaceTypeDefinitionNode[];
        unions: UnionTypeDefinitionNode[];
        objects: ObjectTypeDefinitionNode[];
    },
    callbacks?: Neo4jGraphQLCallbacks,
    validateResolvers = true
) {
    return function (context: SDLValidationContext): ASTVisitor {
        const relationshipTypeToDirectionAndFieldTypeMap = new Map<string, [string, string][]>();
        return {
            Directive(directiveNode: DirectiveNode, _key, _parent, path, ancenstors) {
                const genericDirectiveName = [
                    "default",
                    "coalesce",
                    "queryoptions",
                    "fulltext",
                    "relationship",
                    "populatedby",
                    "customresolver",
                ].find((applicableDirectiveName) =>
                    directiveNode.name.value.toLowerCase().includes(applicableDirectiveName)
                );
                console.log("DIRECTIVE ARGUMENT VALUE::", directiveNode.name.value, genericDirectiveName);
                // Validate only default/coalesce usage
                if (!genericDirectiveName) {
                    return;
                }
                console.log("continue with", directiveNode.name.value);

                const [temp, traversedDef, parentOfTraversedDef] = getPathToDirectiveNode(path, ancenstors);
                const pathToHere = [...temp, `@${directiveNode.name.value}`];

                if (!traversedDef) {
                    console.error("No last definition traversed");
                    return;
                }

                const { isValid, errorMsg, errorPath } = assertArgumentsValue(
                    directiveNode,
                    traversedDef,
                    parentOfTraversedDef,
                    userCustomResolvers,
                    extra,
                    relationshipTypeToDirectionAndFieldTypeMap,
                    callbacks,
                    validateResolvers
                );
                if (!isValid) {
                    const errorOpts = {
                        nodes: [directiveNode, traversedDef],
                        // extensions: {
                        //     exception: { code: VALIDATION_ERROR_CODES[genericDirectiveName.toUpperCase()] },
                        // },
                        path: [...pathToHere, ...errorPath],
                        source: undefined,
                        positions: undefined,
                        originalError: undefined,
                    };

                    // TODO: replace constructor to use errorOpts when dropping support for GraphQL15
                    context.reportError(
                        new GraphQLError(
                            `${errorPath[0] ? `Invalid argument: ${errorPath[0]}, ` : ""}error: ${errorMsg}`,
                            errorOpts.nodes,
                            errorOpts.source,
                            errorOpts.positions,
                            errorOpts.path,
                            errorOpts.originalError
                            // errorOpts.extensions
                        )
                    );
                }
            },
        };
    };
}

function getPathToDirectiveNode(
    path: readonly (number | string)[],
    ancenstors: readonly (ASTNode | readonly ASTNode[])[]
): [
    Array<string>,
    ObjectTypeDefinitionNode | FieldDefinitionNode | InterfaceTypeDefinitionNode | undefined,
    ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode | undefined
] {
    const documentASTNodes = ancenstors[1];
    if (!documentASTNodes || (Array.isArray(documentASTNodes) && !documentASTNodes.length)) {
        return [[], undefined, undefined];
    }
    const [, definitionIdx] = path;
    const traversedDefinition = documentASTNodes[definitionIdx as number];
    const pathToHere: (ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode | FieldDefinitionNode)[] = [
        traversedDefinition,
    ];
    let lastSeenDefinition: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode | FieldDefinitionNode =
        traversedDefinition;
    const getNextDefinition = parsePath(path, traversedDefinition);
    for (const definition of getNextDefinition()) {
        lastSeenDefinition = definition;
        pathToHere.push(definition);
    }
    const parentOfLastSeenDefinition = pathToHere.slice(-2)[0] as
        | ObjectTypeDefinitionNode
        | InterfaceTypeDefinitionNode;
    return [pathToHere.map((n) => n.name.value), lastSeenDefinition, parentOfLastSeenDefinition];
}

function parsePath(
    path: readonly (number | string)[],
    traversedDefinition: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode | FieldDefinitionNode
) {
    return function* getNextDefinition(idx = 2) {
        while (path[idx] && path[idx] !== "directives") {
            // continue parsing for annotated fields
            const key = path[idx] as string;
            const idxAtKey = path[idx + 1] as number;
            traversedDefinition = traversedDefinition[key][idxAtKey];
            yield traversedDefinition;
            idx += 2;
        }
    };
}

type AssertionResponse = {
    isValid: boolean;
    errorMsg?: string;
    errorPath: ReadonlyArray<string | number>;
};

function assertArgumentsValue(
    directiveNode: DirectiveNode,
    traversedDef: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode | FieldDefinitionNode,
    parentDef?: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode,
    userCustomResolvers?: IResolvers | IResolvers[],
    extra?: {
        enums: EnumTypeDefinitionNode[];
        interfaces: InterfaceTypeDefinitionNode[];
        unions: UnionTypeDefinitionNode[];
        objects: ObjectTypeDefinitionNode[];
    },
    relationshipTypeToDirectionAndFieldTypeMap?: Map<string, [string, string][]>,
    callbacks?: Neo4jGraphQLCallbacks,
    validateResolvers = true
): AssertionResponse {
    let isValid = true;
    let errorMsg, errorPath;

    if (directiveNode.name.value === "default") {
        verifyDefault(
            directiveNode,
            traversedDef as FieldDefinitionNode,
            (error) => {
                isValid = false;
                errorMsg = error.message;
                errorPath = ["value"];
                // errorPath = _path;
            },
            extra?.enums
        );
    }

    if (directiveNode.name.value === "coalesce") {
        verifyCoalesce(
            directiveNode,
            traversedDef as FieldDefinitionNode,
            (error) => {
                isValid = false;
                errorMsg = error.message;
                errorPath = ["value"];
                // errorPath = _path;
            },
            extra?.enums
        );
    }

    if (directiveNode.name.value === "queryOptions") {
        verifyQueryOptions(directiveNode, traversedDef as ObjectTypeDefinitionNode, (error) => {
            isValid = false;
            errorMsg = error.message;
            errorPath = ["limit"];
            // errorPath = _path;
        });
    }

    if (directiveNode.name.value === "fulltext") {
        verifyFulltext(directiveNode, traversedDef as ObjectTypeDefinitionNode, (error) => {
            isValid = false;
            errorMsg = error.message;
            errorPath = ["indexes"];
            // errorPath = _path;
        });
    }

    if (directiveNode.name.value === "relationship") {
        if (!relationshipTypeToDirectionAndFieldTypeMap) {
            relationshipTypeToDirectionAndFieldTypeMap = new Map<string, [string, string][]>();
        }
        verifyRelationship(
            directiveNode,
            traversedDef as FieldDefinitionNode,
            (error) => {
                isValid = false;
                errorMsg = error.message;
                errorPath = [];
                // errorPath = _path;
            },
            relationshipTypeToDirectionAndFieldTypeMap,
            extra
        );
    }

    if (directiveNode.name.value === "populatedBy") {
        verifyPopulatedBy(
            directiveNode,
            traversedDef as FieldDefinitionNode,
            (error) => {
                isValid = false;
                errorMsg = error.message;
                errorPath = ["callback"];
                // errorPath = _path;
            },
            callbacks
        );
    }

    if (directiveNode.name.value === "customResolver") {
        verifyCustomResolver(
            directiveNode,
            traversedDef as FieldDefinitionNode,
            (error) => {
                isValid = false;
                errorMsg = error.message;
                errorPath = [];
                // errorPath = _path;
            },
            parentDef,
            userCustomResolvers,
            extra,
            validateResolvers
        );
    }

    return { isValid, errorMsg, errorPath };
}

// TODO: WIP
function verifyCustomResolver(
    fulltextDirective: DirectiveNode,
    traversedDefinition: FieldDefinitionNode,
    errorCallback: (err: Error) => void,
    parentDef?: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode,
    userCustomResolvers?: IResolvers | IResolvers[],
    extra?: {
        enums: EnumTypeDefinitionNode[];
        interfaces: InterfaceTypeDefinitionNode[];
        unions: UnionTypeDefinitionNode[];
        objects: ObjectTypeDefinitionNode[];
    },
    validateResolvers = true
) {
    if (!parentDef) {
        // delegate
        return;
    }
    // TODO: maybe memoize?
    const customResolvers = asArray(userCustomResolvers).find((r) => !!r[parentDef.name.value])?.[
        parentDef.name.value
    ] as IResolvers;
    console.log("parent:", parentDef, "traversed", traversedDefinition);
    try {
        if (
            validateResolvers &&
            parentDef.kind !== Kind.INTERFACE_TYPE_DEFINITION &&
            !customResolvers?.[traversedDefinition.name.value]
        ) {
            throw new Error(
                `@customResolver needs a resolver for field \`${traversedDefinition.name.value}\` to be provided.`
            );
        }

        const directiveRequiresArgument = fulltextDirective?.arguments?.find((arg) => arg.name.value === "requires");

        if (!directiveRequiresArgument) {
            // delegate to DirectiveArgumentOfCorrectType
            return;
        }

        if (directiveRequiresArgument?.value.kind !== Kind.STRING) {
            throw new Error("@customResolver.requires is invalid. Expected a String.");
        }

        if (!extra) {
            throw new Error("NEED EXTRA!");
        }

        const selectionSetDocument = parse(`{ ${directiveRequiresArgument.value.value} }`);
        // TODO: need a schema for this..
        // validateSelectionSet(schema, parentDef, selectionSetDocument);
    } catch (err) {
        errorCallback(err as Error);
    }
}
/*
function validateSelectionSet(
    baseSchema: GraphQLSchema,
    object: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode,
    selectionSetDocument: DocumentNode
) {

    const validationSchema = mergeSchemas({
        schemas: [baseSchema],
        typeDefs: `
                schema {
                    query: ${object.name.value}
                }
            `,
        assumeValid: true,
    });
    const errors = validate(validationSchema, selectionSetDocument);
    if (errors.length) {
        throw new Error(
            `@customResolver::: Invalid selection set provided to @customResolver on ${
                object.name.value
            }:\n${errors.join("\n")}`
        );
    }
}
*/

function verifyPopulatedBy(
    relationshipDirective: DirectiveNode,
    traversedDefinition: FieldDefinitionNode,
    errorCallback: (err: Error) => void,
    callbacks?: Neo4jGraphQLCallbacks
) {
    const callbackArg = relationshipDirective.arguments?.find((x) => x.name.value === "callback");
    if (!callbackArg) {
        // delegate to DirectiveArgumentOfCorrectType rule
        return;
    }
    const callbackName = parseValueNode(callbackArg.value);
    try {
        if (!callbacks) {
            throw new Error(`@populatedBy.callback needs to be provided in features option.`);
        }
        if (typeof (callbacks || {})[callbackName] !== "function") {
            throw new Error(`@populatedBy.callback \`${callbackName}\` must be of type Function.`);
        }
    } catch (err) {
        errorCallback(err as Error);
    }
}

function verifyRelationship(
    relationshipDirective: DirectiveNode,
    traversedDefinition: FieldDefinitionNode,
    errorCallback: (err: Error) => void,
    relationshipTypeToDirectionAndFieldTypeMap: Map<string, [string, string][]>,
    extra?: {
        enums: EnumTypeDefinitionNode[];
        interfaces: InterfaceTypeDefinitionNode[];
        unions: UnionTypeDefinitionNode[];
    }
) {
    const typeArg = relationshipDirective.arguments?.find((a) => a.name.value === "type");
    const directionArg = relationshipDirective.arguments?.find((a) => a.name.value === "direction");
    const propertiesArg = relationshipDirective.arguments?.find((a) => a.name.value === "properties");
    if (!typeArg && !directionArg) {
        // delegate to DirectiveArgumentOfCorrectType rule
        return;
    }
    try {
        if (typeArg && directionArg) {
            const fieldType = getPrettyName(traversedDefinition.type);
            const typeValue = parseValueNode(typeArg.value);
            const directionValue = parseValueNode(directionArg.value);
            const visitedRelationshipsWithSameType = relationshipTypeToDirectionAndFieldTypeMap.get(typeValue);
            if (visitedRelationshipsWithSameType) {
                visitedRelationshipsWithSameType.forEach(([existingDirection, existingFieldType]) => {
                    if (existingDirection === directionValue && existingFieldType === fieldType) {
                        throw new Error(
                            `@relationship invalid. Multiple fields of the same type cannot have a relationship with the same direction and type combination.`
                        );
                    }
                });
            }
            const updated = (visitedRelationshipsWithSameType || []).concat([[directionValue, fieldType]]);
            relationshipTypeToDirectionAndFieldTypeMap.set(typeValue, updated);
        }
        if (propertiesArg) {
            const propertiesValue = parseValueNode(propertiesArg.value);
            if (!extra) {
                throw new Error("NEED EXTRA!");
            }
            const relationshipPropertiesInterface = extra.interfaces.filter(
                (i) => i.name.value.toLowerCase() === propertiesValue.toLowerCase()
            );
            if (relationshipPropertiesInterface.length > 1) {
                throw new Error(
                    `@relationship.properties invalid. Cannot have more than 1 interface represent the relationship properties.`
                );
            }
            if (!relationshipPropertiesInterface.length) {
                throw new Error(
                    `@relationship.properties invalid. Cannot find interface to represent the relationship properties: ${propertiesValue}.`
                );
            }
            const isRelationshipPropertiesInterfaceAnnotated = relationshipPropertiesInterface[0]?.directives?.some(
                (d) => d.name.value === "relationshipProperties"
            );

            if (!isRelationshipPropertiesInterfaceAnnotated) {
                throw new Error(
                    `@relationship.properties invalid. Properties interface ${propertiesValue} must use directive \`@relationshipProperties\`.`
                );
            }
        }
    } catch (err) {
        errorCallback(err as Error);
    }
}

function verifyFulltext(
    fulltextDirective: DirectiveNode,
    traversedDefinition: ObjectTypeDefinitionNode,
    errorCallback: (err: Error) => void
) {
    const indexesArg = fulltextDirective.arguments?.find((a) => a.name.value === "indexes");
    if (!indexesArg) {
        // delegate to DirectiveArgumentOfCorrectType rule
        return;
    }
    const indexesValue = parseValueNode(indexesArg.value) as FulltextIndex[];
    const compatibleFields = traversedDefinition.fields?.filter((f) => {
        if (f.type.kind === Kind.NON_NULL_TYPE) {
            const innerType = f.type.type;
            if (innerType.kind === Kind.NAMED_TYPE) {
                return ["String", "ID"].includes(innerType.name.value);
            }
        }
        if (f.type.kind === Kind.NAMED_TYPE) {
            return ["String", "ID"].includes(f.type.name.value);
        }
        return false;
    });
    try {
        indexesValue.forEach((index) => {
            const indexName = index.indexName;
            const names = indexesValue.filter((i) => indexName === i.indexName);
            if (names.length > 1) {
                throw new Error(`@fulltext.indexes invalid value for: ${indexName}. Duplicate name.`);
            }

            index.fields.forEach((field) => {
                const foundField = compatibleFields?.find((f) => f.name.value === field);
                if (!foundField) {
                    throw new Error(
                        `@fulltext.indexes invalid value for: ${indexName}. Field ${field} is not of type String or ID.`
                    );
                }
            });
        });
    } catch (err) {
        errorCallback(err as Error);
    }
}

function verifyQueryOptions(
    queryOptionsDirective: DirectiveNode,
    traversedDefinition: ObjectTypeDefinitionNode,
    errorCallback: (err: Error) => void
) {
    // TODO: QueryOptionsDirective type
    const limitArg = queryOptionsDirective.arguments?.find((a) => a.name.value === "limit");
    if (!limitArg) {
        // nothing to check, argument is optional
        return;
    }
    if (limitArg.value.kind !== Kind.OBJECT) {
        // delegate to DirectiveArgumentOfCorrectType rule
        return;
    }
    const defaultArg = limitArg.value.fields.find((f) => f.name.value === "default");
    const maxArg = limitArg.value.fields.find((f) => f.name.value === "max");
    if (!defaultArg && !maxArg) {
        // nothing to check, fields are optional
        return;
    }
    const defaultLimit = parseArgumentToInt(defaultArg);
    const maxLimit = parseArgumentToInt(maxArg);
    try {
        if (defaultLimit) {
            const defaultValue = defaultLimit.toNumber();
            // default must be greater than 0
            if (defaultValue <= 0) {
                throw new Error(`@queryOptions.limit.default invalid value: ${defaultValue}. Must be greater than 0.`);
            }
        }
        if (maxLimit) {
            const maxValue = maxLimit.toNumber();
            // max must be greater than 0
            if (maxValue <= 0) {
                throw new Error(`@queryOptions.limit.max invalid value: ${maxValue}. Must be greater than 0.`);
            }
        }
        if (defaultLimit && maxLimit) {
            const defaultValue = defaultLimit.toNumber();
            const maxValue = maxLimit.toNumber();
            // default must be smaller than max
            if (maxLimit < defaultLimit) {
                throw new Error(
                    `@queryOptions.limit.max invalid value: ${maxValue}. Must be greater than limit.default: ${defaultValue}.`
                );
            }
        }
    } catch (err) {
        errorCallback(err as Error);
    }
}

function parseArgumentToInt(field: ObjectFieldNode | undefined): neo4j.Integer | undefined {
    if (field) {
        const parsed = parseValueNode(field.value) as number;
        return neo4j.int(parsed);
    }
    return undefined;
}

// TODO: refactor this file
// > maybe create a rule to check directive argument type matches field type

function verifyDefault(
    defaultDirective: DirectiveNode,
    traversedDefinition: FieldDefinitionNode,
    errorCallback: (err: Error) => void,
    enums?: EnumTypeDefinitionNode[]
) {
    const isArray = traversedDefinition.type.kind === Kind.LIST_TYPE;
    const defaultArg = defaultDirective.arguments?.find((a) => a.name.value === "value");
    const expectedType = getInnerTypeName(traversedDefinition.type);

    if (!defaultArg) {
        // delegate to DirectiveArgumentOfCorrectType rule
        return;
    }

    try {
        if (isArray) {
            if (defaultArg.value.kind !== Kind.LIST) {
                throw new Error(
                    `@default.value on ${expectedType} list fields must be a list of ${expectedType} values`
                );
            }

            defaultArg.value.values.forEach((v) => {
                if (!v) {
                    // delegate to DirectiveArgumentOfCorrectType rule
                    return;
                }
                if (fromValueKind(v, enums).toLowerCase() !== expectedType.toLowerCase()) {
                    throw new Error(
                        `@default.value on ${expectedType} list fields must be a list of ${expectedType} values`
                    );
                }
            });
        } else {
            if (_isTemporal(expectedType)) {
                if (Number.isNaN(Date.parse((defaultArg?.value as StringValueNode).value))) {
                    throw new Error(`@default.value is not a valid ${expectedType}`);
                }
            } else if (fromValueKind(defaultArg.value, enums).toLowerCase() !== expectedType.toLowerCase()) {
                throw new Error(`@default.value on ${expectedType} fields must be of type ${expectedType}`);
            }
        }
    } catch (err) {
        errorCallback(err as Error);
    }
}

function _isTemporal(typeName: string) {
    return ["DateTime", "Date", "Time", "LocalDateTime", "LocalTime"].includes(typeName);
}

function verifyCoalesce(
    coalesceDirective: DirectiveNode,
    traversedDefinition: FieldDefinitionNode,
    errorCallback: (err: Error) => void,
    enums?: EnumTypeDefinitionNode[]
) {
    const isArray = traversedDefinition.type.kind === Kind.LIST_TYPE;
    const coalesceArg = coalesceDirective.arguments?.find((a) => a.name.value === "value");
    const expectedType = getInnerTypeName(traversedDefinition.type);

    if (!coalesceArg) {
        // delegate to DirectiveArgumentOfCorrectType rule
        return;
    }

    try {
        if (isArray) {
            if (coalesceArg.value.kind !== Kind.LIST) {
                throw new Error(
                    `@coalesce.value on ${expectedType} list fields must be a list of ${expectedType} values`
                );
            }

            coalesceArg.value.values.forEach((v) => {
                if (!v) {
                    // delegate to DirectiveArgumentOfCorrectType rule
                    return;
                }
                console.log(expectedType, fromValueKind(v, enums));
                if (fromValueKind(v, enums).toLowerCase() !== expectedType.toLowerCase()) {
                    throw new Error(
                        `@coalesce.value on ${expectedType} list fields must be a list of ${expectedType} values`
                    );
                }
            });
        } else {
            if (fromValueKind(coalesceArg.value, enums).toLowerCase() !== expectedType.toLowerCase()) {
                throw new Error(`@coalesce.value on ${expectedType} fields must be of type ${expectedType}`);
            }
        }
    } catch (err) {
        errorCallback(err as Error);
    }
}

// TODO: fix required!
function getPrettyName(typeNode: TypeNode): string {
    if (typeNode.kind === Kind.LIST_TYPE) {
        return `[${getInnerTypeName(typeNode.type)}]`;
    }
    if (typeNode.kind === Kind.NON_NULL_TYPE) {
        return `${getInnerTypeName(typeNode.type)}!`;
    }
    // Kind.NAMED_TYPE
    return typeNode.name.value;
}

function getInnerTypeName(typeNode: TypeNode): string {
    if (typeNode.kind === Kind.LIST_TYPE) {
        return getInnerTypeName(typeNode.type);
    }
    if (typeNode.kind === Kind.NON_NULL_TYPE) {
        return getInnerTypeName(typeNode.type);
    }
    // Kind.NAMED_TYPE
    return typeNode.name.value;
}

// TODO: unknown??
function fromValueKind(valueNode: ValueNode, enums?: EnumTypeDefinitionNode[]): string {
    switch (valueNode.kind) {
        case Kind.STRING:
            return "string";
        case Kind.INT:
            return "int";
        case Kind.FLOAT:
            return "float";
        case Kind.BOOLEAN:
            return "boolean";
        case Kind.ENUM: {
            const enumType = enums?.find((x) => x.values?.find((v) => v.name.value === valueNode.value));
            console.log("enum:", valueNode.value, enums);
            if (enumType) {
                return enumType.name.value;
            }
            break;
        }
        default:
            // for Kind.OBJECT and Kind.VARIABLE
            // not supported for @default and @coalesce but maybe others?
            return "unknown";
    }
    return "unknown";
}
