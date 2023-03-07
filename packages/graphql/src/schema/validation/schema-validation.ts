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

import { mergeSchemas } from "@graphql-tools/schema";
import {
    buildSchema,
    DirectiveLocation,
    DocumentNode,
    extendSchema,
    GraphQLBoolean,
    GraphQLDirective,
    GraphQLEnumType,
    GraphQLInputObjectType,
    GraphQLList,
    GraphQLNamedType,
    GraphQLNonNull,
    GraphQLSchema,
    InputObjectTypeDefinitionNode,
    Kind,
    parse,
    typeFromAST,
    validate,
    visit,
} from "graphql";
import type { ASTVisitor } from "graphql/language/visitor";

const directives: GraphQLDirective[] = [];
const types: GraphQLNamedType[] = [];

export function makeValidationSchema(userDocument: DocumentNode, augmentedDocument: DocumentNode) {
    // const validateBeforeTC = composer.createEnumTC(
    //     `enum AuthorizationValidateBefore { READ, CREATE, UPDATE, DELETE, CREATE_RELATIONSHIP, DELETE_RELATIONSHIP }`
    // );
    // const validateAfterTC = composer.createEnumTC(
    //     `enum AuthorizationValidateAfter { CREATE, UPDATE, DELETE, CREATE_RELATIONSHIP, DELETE_RELATIONSHIP }`
    // );
    // const filterTC = composer.createEnumTC(
    //     `enum AuthorizationFilterOperation { READ, UPDATE, DELETE, CREATE_RELATIONSHIP, DELETE_RELATIONSHIP }`
    // );

    const generateCustomAnnotation: ASTVisitor = {
        // Name: { leave: (node) => node.value },
        // Variable: { leave: (node) => "$" + node.name },

        // Document

        Document: {
            leave: (node) => console.log("document", node),
        },

        // OperationDefinition: {
        //     leave(node) {
        //         const varDefs = wrap("(", join(node.variableDefinitions, ", "), ")");
        //         const prefix = join([node.operation, join([node.name, varDefs]), join(node.directives, " ")], " ");

        //         // Anonymous queries with no directives or variable definitions can use
        //         // the query short form.
        //         return (prefix === "query" ? "" : prefix + " ") + node.selectionSet;
        //     },
        // },

        // VariableDefinition: {
        //     leave: ({ variable, type, defaultValue, directives }) =>
        //         variable + ": " + type + wrap(" = ", defaultValue) + wrap(" ", join(directives, " ")),
        // },
        // SelectionSet: { leave: ({ selections }) => block(selections) },

        // Field: {
        //     leave({ alias, name, arguments: args, nullabilityAssertion, directives, selectionSet }) {
        //         const prefix = join([wrap("", alias, ": "), name], "");
        //         let argsLine = prefix + wrap("(", join(args, ", "), ")");

        //         if (argsLine.length > MAX_LINE_LENGTH) {
        //             argsLine = prefix + wrap("(\n", indent(join(args, "\n")), "\n)");
        //         }

        //         return join([
        //             argsLine,
        //             // Note: Client Controlled Nullability is experimental and may be
        //             // changed or removed in the future.
        //             nullabilityAssertion,
        //             wrap(" ", join(directives, " ")),
        //             wrap(" ", selectionSet),
        //         ]);
        //     },
        // },
        // Argument: { leave: ({ name, value }) => name + ": " + value },

        // Nullability Modifiers

        // ListNullabilityOperator: {
        //     leave({ nullabilityAssertion }) {
        //         return join(["[", nullabilityAssertion, "]"]);
        //     },
        // },

        // NonNullAssertion: {
        //     leave({ nullabilityAssertion }) {
        //         return join([nullabilityAssertion, "!"]);
        //     },
        // },

        // ErrorBoundary: {
        //     leave({ nullabilityAssertion }) {
        //         return join([nullabilityAssertion, "?"]);
        //     },
        // },

        // Fragments

        // FragmentSpread: {
        //     leave: ({ name, directives }) => "..." + name + wrap(" ", join(directives, " ")),
        // },

        // InlineFragment: {
        //     leave: ({ typeCondition, directives, selectionSet }) =>
        //         join(["...", wrap("on ", typeCondition), join(directives, " "), selectionSet], " "),
        // },

        // FragmentDefinition: {
        //     leave: ({ name, typeCondition, variableDefinitions, directives, selectionSet }) =>
        //         // Note: fragment variable definitions are experimental and may be changed
        //         // or removed in the future.
        //         `fragment ${name}${wrap("(", join(variableDefinitions, ", "), ")")} ` +
        //         `on ${typeCondition} ${wrap("", join(directives, " "), " ")}` +
        //         selectionSet,
        // },

        // Value

        // IntValue: { leave: ({ value }) => value },
        // FloatValue: { leave: ({ value }) => value },
        // StringValue: {
        //     leave: ({ value, block: isBlockString }) => (isBlockString ? printBlockString(value) : printString(value)),
        // },
        // BooleanValue: { leave: ({ value }) => (value ? "true" : "false") },
        // NullValue: { leave: () => "null" },
        // EnumValue: { leave: ({ value }) => value },
        // ListValue: { leave: ({ values }) => "[" + join(values, ", ") + "]" },
        // ObjectValue: { leave: ({ fields }) => "{ " + join(fields, ", ") + " }" },
        // ObjectField: { leave: ({ name, value }) => name + ": " + value },

        // Directive

        // Directive: {
        //     leave: ({ name, arguments: args }) => console.log("directive", name),
        // },

        // Type

        // NamedType: { leave: ({ name }) => name },
        // ListType: { leave: ({ type }) => "[" + type + "]" },
        // NonNullType: { leave: ({ type }) => type + "!" },

        // Type System Definitions

        // SchemaDefinition: {
        //     leave: ({ description, directives, operationTypes }) =>
        //         wrap("", description, "\n") + join(["schema", join(directives, " "), block(operationTypes)], " "),
        // },

        // OperationTypeDefinition: {
        //     leave: ({ operation, type }) => operation + ": " + type,
        // },

        // ScalarTypeDefinition: {
        //     leave: ({ description, name, directives }) =>
        //         wrap("", description, "\n") + join(["scalar", name, join(directives, " ")], " "),
        // },

        ObjectTypeDefinition: {
            leave: ({ description, name, interfaces, directives, fields }) =>
                makeAuthorizationTypesForTypename(name.value, augmentedDocument),
        },

        // FieldDefinition: {
        //     leave: ({ description, name, arguments: args, type, directives }) =>
        //         wrap("", description, "\n") +
        //         name +
        //         (hasMultilineItems(args)
        //             ? wrap("(\n", indent(join(args, "\n")), "\n)")
        //             : wrap("(", join(args, ", "), ")")) +
        //         ": " +
        //         type +
        //         wrap(" ", join(directives, " ")),
        // },

        // InputValueDefinition: {
        //     leave: ({ description, name, type, defaultValue, directives }) =>
        //         wrap("", description, "\n") +
        //         join([name + ": " + type, wrap("= ", defaultValue), join(directives, " ")], " "),
        // },

        // InterfaceTypeDefinition: {
        //     leave: ({ description, name, interfaces, directives, fields }) =>
        //         wrap("", description, "\n") +
        //         join(
        //             ["interface", name, wrap("implements ", join(interfaces, " & ")), join(directives, " "), block(fields)],
        //             " "
        //         ),
        // },

        // UnionTypeDefinition: {
        //     leave: ({ description, name, directives, types }) =>
        //         wrap("", description, "\n") +
        //         join(["union", name, join(directives, " "), wrap("= ", join(types, " | "))], " "),
        // },

        // EnumTypeDefinition: {
        //     leave: ({ description, name, directives, values }) =>
        //         wrap("", description, "\n") + join(["enum", name, join(directives, " "), block(values)], " "),
        // },

        // EnumValueDefinition: {
        //     leave: ({ description, name, directives }) =>
        //         wrap("", description, "\n") + join([name, join(directives, " ")], " "),
        // },

        // InputObjectTypeDefinition: {
        //     leave: ({ description, name, directives, fields }) =>
        //         wrap("", description, "\n") + join(["input", name, join(directives, " "), block(fields)], " "),
        // },

        // DirectiveDefinition: {
        //     leave: ({ description, name, arguments: args, repeatable, locations }) =>
        //         wrap("", description, "\n") +
        //         "directive @" +
        //         name +
        //         (hasMultilineItems(args)
        //             ? wrap("(\n", indent(join(args, "\n")), "\n)")
        //             : wrap("(", join(args, ", "), ")")) +
        //         (repeatable ? " repeatable" : "") +
        //         " on " +
        //         join(locations, " | "),
        // },

        // SchemaExtension: {
        //     leave: ({ directives, operationTypes }) =>
        //         join(["extend schema", join(directives, " "), block(operationTypes)], " "),
        // },

        // ScalarTypeExtension: {
        //     leave: ({ name, directives }) => join(["extend scalar", name, join(directives, " ")], " "),
        // },

        // ObjectTypeExtension: {
        //     leave: ({ name, interfaces, directives, fields }) =>
        //         join(
        //             [
        //                 "extend type",
        //                 name,
        //                 wrap("implements ", join(interfaces, " & ")),
        //                 join(directives, " "),
        //                 block(fields),
        //             ],
        //             " "
        //         ),
        // },

        // InterfaceTypeExtension: {
        //     leave: ({ name, interfaces, directives, fields }) =>
        //         join(
        //             [
        //                 "extend interface",
        //                 name,
        //                 wrap("implements ", join(interfaces, " & ")),
        //                 join(directives, " "),
        //                 block(fields),
        //             ],
        //             " "
        //         ),
        // },

        // UnionTypeExtension: {
        //     leave: ({ name, directives, types }) =>
        //         join(["extend union", name, join(directives, " "), wrap("= ", join(types, " | "))], " "),
        // },

        // EnumTypeExtension: {
        //     leave: ({ name, directives, values }) => join(["extend enum", name, join(directives, " "), block(values)], " "),
        // },

        // InputObjectTypeExtension: {
        //     leave: ({ name, directives, fields }) =>
        //         join(["extend input", name, join(directives, " "), block(fields)], " "),
        // },
    };

    visit(userDocument, generateCustomAnnotation);

    const schemaToExtend = new GraphQLSchema({
        directives,
        types,
    });

    // const filteredDoc = {
    //     ...augmentedDocument,
    //     definitions: augmentedDocument.definitions.reduce((res: DefinitionNode[], def) => {
    //         if (def.kind === "InputObjectTypeDefinition") {
    //             const fields = def.fields?.filter((f) => {
    //                 const type = getArgumentType(f.type);

    //                 const nodeMatch =
    //                     /(?<nodeName>.+)(?:ConnectInput|ConnectWhere|CreateInput|DeleteInput|DisconnectInput|Options|RelationInput|Sort|UpdateInput|Where)/gm.exec(
    //                         type
    //                     );
    //                 if (nodeMatch?.groups?.nodeName) {
    //                     if (nodeNames.includes(nodeMatch.groups.nodeName)) {
    //                         return false;
    //                     }
    //                 }

    //                 return true;
    //             });

    //             if (!fields?.length) {
    //                 return res;
    //             }

    //             return [
    //                 ...res,
    //                 {
    //                     ...def,
    //                     fields,
    //                 },
    //             ];
    //         }
    //     }
    // }

    const validationSchema = extendSchema(schemaToExtend, augmentedDocument);
}

function makeAuthorizationTypesForTypename(typename: string, augmentedDocument: DocumentNode) {
    console.log("in for", typename);
    const whereTypeDefinitionNode = augmentedDocument.definitions.find(
        (d) => d.kind === Kind.INPUT_OBJECT_TYPE_DEFINITION && d.name.value === `${typename}Where`
    ) as InputObjectTypeDefinitionNode;

    const nodeArgumentType = new GraphQLInputObjectType({
        name: `${typename}Where`,
        fields: {},
        astNode: whereTypeDefinitionNode,
    });

    const authorizationWhere = new GraphQLInputObjectType({
        name: `${typename}AuthorizationWhere`,
        fields() {
            return {
                AND: {
                    type: new GraphQLList(authorizationWhere),
                },
                OR: {
                    type: new GraphQLList(authorizationWhere),
                },
                NOT: {
                    type: authorizationWhere,
                },
                node: {
                    type: nodeArgumentType,
                },
            };
        },
    });
    types.push(authorizationWhere);
    /*
WE HAVE:
export interface InputObjectTypeDefinitionNode {
  readonly kind: Kind.INPUT_OBJECT_TYPE_DEFINITION;
  readonly loc?: Location;
  readonly description?: StringValueNode;
  readonly name: NameNode;
  readonly directives?: ReadonlyArray<ConstDirectiveNode>;
  readonly fields?: ReadonlyArray<InputValueDefinitionNode>;
}

WE WANT: 
export declare class GraphQLInputObjectType {
  name: string;
  description: Maybe<string>;
  extensions: Readonly<GraphQLInputObjectTypeExtensions>;
  astNode: Maybe<InputObjectTypeDefinitionNode>;
  extensionASTNodes: ReadonlyArray<InputObjectTypeExtensionNode>;
  private _fields;
  constructor(config: Readonly<GraphQLInputObjectTypeConfig>);
  get [Symbol.toStringTag](): string;
  getFields(): GraphQLInputFieldMap;
  toConfig(): GraphQLInputObjectTypeNormalizedConfig;
  toString(): string;
  toJSON(): string;
}
export interface GraphQLInputObjectTypeConfig {
  name: string;
  description?: Maybe<string>;
  fields: ThunkObjMap<GraphQLInputFieldConfig>;
  extensions?: Maybe<Readonly<GraphQLInputObjectTypeExtensions>>;
  astNode?: Maybe<InputObjectTypeDefinitionNode>;
  extensionASTNodes?: Maybe<ReadonlyArray<InputObjectTypeExtensionNode>>;
}
export interface GraphQLInputFieldConfig {
  description?: Maybe<string>;
  type: GraphQLInputType;
  defaultValue?: unknown;
  deprecationReason?: Maybe<string>;
  extensions?: Maybe<Readonly<GraphQLInputFieldExtensions>>;
  astNode?: Maybe<InputValueDefinitionNode>;
}
*/

    const authorizationFilterRule = new GraphQLInputObjectType({
        name: `${typename}AuthorizationFilterRule`,
        fields() {
            return {
                // operations: {
                //     type: new GraphQLEnumType(authorizationWhere),
                // },
                requireAuthentication: {
                    type: GraphQLBoolean,
                    defaultValue: true,
                },
                where: {
                    type: authorizationWhere,
                },
            };
        },
    });
    types.push(authorizationFilterRule);

    const authorizationValidateRule = new GraphQLInputObjectType({
        name: `${typename}AuthorizationValidateRule`,
        fields() {
            return {
                // before: {
                //     type: new GraphQLEnumType(authorizationWhere),
                // },
                // after: {
                //     type: new GraphQLEnumType(authorizationWhere),
                // },
                requireAuthentication: {
                    type: GraphQLBoolean,
                    defaultValue: true,
                },
                where: {
                    type: authorizationWhere,
                },
            };
        },
    });
    types.push(authorizationValidateRule);

    const authorizationDirective = new GraphQLDirective({
        name: `${typename}Authorization`,
        locations: [DirectiveLocation.FIELD_DEFINITION, DirectiveLocation.OBJECT, DirectiveLocation.INTERFACE],
        args: {
            filter: {
                description: "The name of the Neo4j property",
                type: new GraphQLList(authorizationFilterRule),
            },
            validate: {
                description: "validate",
                type: new GraphQLList(authorizationValidateRule),
            },
        },
    });
    directives.push(authorizationDirective);
}
