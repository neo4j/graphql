import { InputValueDefinitionNode, DirectiveNode } from "graphql";
import { IExecutableSchemaDefinition } from "@graphql-tools/schema";

export type TypeDefs = IExecutableSchemaDefinition["typeDefs"];

export type Resolvers = IExecutableSchemaDefinition["resolvers"];

export type SchemaDirectives = IExecutableSchemaDefinition["schemaDirectives"];

export type DriverConfig = {
    database: string;
    bookmarks: string | string[];
};

export interface BaseAuthRule {
    isAuthenticated?: boolean;
    allow?: { [k: string]: any } | "*";
    bind?: { [k: string]: any } | "*";
    where?: { [k: string]: any } | "*";
    roles?: string[];
    AND?: BaseAuthRule[];
    OR?: BaseAuthRule[];
}

export interface AuthRule extends BaseAuthRule {
    operations?: AuthOperations[] | "*";
}

export type Auth = {
    rules: AuthRule[];
    type: "JWT";
};

/**
 * Metadata about a field.type on either
 * FieldDefinitionNode or InputValueDefinitionNode.
 */
export interface TypeMeta {
    name: string;
    array?: boolean;
    required: boolean;
    pretty: string;
    input: {
        where: {
            type: string;
            pretty: string;
        };
        create: {
            type: string;
            pretty: string;
        };
        update: {
            type: string;
            pretty: string;
        };
    };
}

/**
 * Representation a ObjectTypeDefinitionNode field.
 */
export interface BaseField {
    fieldName: string;
    typeMeta: TypeMeta;
    otherDirectives: DirectiveNode[];
    arguments: InputValueDefinitionNode[];
    private?: boolean;
    auth?: Auth;
    description?: string;
    readonly?: boolean;
    writeonly?: boolean;
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
export interface PrimitiveField extends BaseField {
    autogenerate?: boolean;
    defaultValue?: any;
    coalesceValue?: any;
}

export type CustomScalarField = BaseField;

export type CustomEnumField = BaseField;

export interface UnionField extends BaseField {
    nodes?: string[];
}

export type InterfaceField = BaseField;

export type ObjectField = BaseField;

export interface DateTimeField extends PrimitiveField {
    timestamps?: TimeStampOperations[];
}

export type PointField = BaseField;

export type SortDirection = "ASC" | "DESC";

export interface GraphQLSortArg {
    [field: string]: SortDirection;
}

/**
 * Representation of the options arg
 * passed to resolvers.
 */
export interface GraphQLOptionsArg {
    limit?: number;
    skip?: number;
    sort?: GraphQLSortArg[];
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

export type AuthOperations = "create" | "read" | "update" | "delete" | "connect" | "disconnect";

export type AuthOrders = "pre" | "post";

/**
 * Whats returned when deleting nodes
 */
export interface DeleteInfo {
    nodesDeleted: number;
    relationshipsDeleted: number;
}

export type TimeStampOperations = "create" | "update";
