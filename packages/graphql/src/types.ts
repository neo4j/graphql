import { InputValueDefinitionNode, DirectiveNode } from "graphql";

/**
 * Metadata about a field.type on either
 * FieldDefinitionNode or InputValueDefinitionNode.
 */
export interface TypeMeta {
    name: string;
    array: boolean;
    required: boolean;
    pretty: string;
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
 * Representation of the options arg
 * passed to resolvers.
 */
export interface GraphQLOptionsArg {
    limit?: number;
    skip?: number;
    sort?: string[];
}

/**
 * Representation of the query arg
 * passed to resolvers.
 */
export interface GraphQLQueryArg {
    [k: string]: any | GraphQLOptionsArg | GraphQLOptionsArg[];
    _AND?: GraphQLOptionsArg[];
    _OR?: GraphQLOptionsArg[];
}
