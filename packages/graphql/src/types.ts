import { DirectiveNode } from "graphql";

export interface TypeMeta {
    name: string;
    array: boolean;
    required: boolean;
    pretty: string;
}

export interface BaseField {
    fieldName: string;
    typeMeta: TypeMeta;
    otherDirectives: DirectiveNode[];
}

export interface RelationField extends BaseField {
    direction: "OUT" | "IN";
}

export interface CypherField extends BaseField {
    statement: string;
}

export type PrimitiveField = BaseField;

export type NestedField = BaseField;
