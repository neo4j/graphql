import { InputValueDefinitionNode, DirectiveNode, TypeNode } from "graphql";

/**
 * Metadata about a field.type on either
 * FieldDefinitionNode or InputValueDefinitionNode.
 */
export interface TypeMeta {
    name: string;
    array: boolean;
    required: boolean;
    pretty: string;
    type: TypeNode;
}

/**
 * Representation a ObjectTypeDefinitionNode field.
 */
export interface BaseField {
    fieldName: string;
    typeMeta: TypeMeta;
    otherDirectives: DirectiveNode[];
    arguments: InputValueDefinitionNode[];
}

/**
 * Representation of the `@relationship` directive and its meta.
 */
export interface RelationField extends BaseField {
    direction: "OUT" | "IN";
    type: string;
    union?: UnionField;
}

/**
 * Representation of the `@cypher` directive and its meta.
 */
export interface CypherField extends BaseField {
    statement: string;
}

/**
 * Representation of any field thats not
 * a cypher directive or relationship directive
 * String, Int, Float, ID, Boolean... (custom scalars).
 */
export type PrimitiveField = BaseField;

/**
 * custom scalars.
 */
export type CustomScalarField = BaseField;

/**
 * custom Enum.
 */
export type CustomEnumField = BaseField;

/**
 * custom Union.
 */
export interface UnionField extends BaseField {
    nodes?: string[];
}

/**
 * custom Interface.
 */
export type InterfaceField = BaseField;

/**
 * custom Object Node.
 */
export type ObjectField = BaseField;

/**
 * Representation of the options arg
 * passed to resolvers.
 */
export interface GraphQLOptionsArg {
    limit?: number;
    skip?: number;
    sort?: string[];
}

/**
 * Representation of the where arg
 * passed to resolvers.
 */
export interface GraphQLWhereArg {
    [k: string]: any | GraphQLOptionsArg | GraphQLOptionsArg[];
    AND?: GraphQLOptionsArg[];
    OR?: GraphQLOptionsArg[];
}

export type AuthOperations = "create" | "read" | "update" | "delete";
