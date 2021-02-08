import { DirectiveNode, NamedTypeNode } from "graphql";
import {
    RelationField,
    CypherField,
    PrimitiveField,
    CustomEnumField,
    CustomScalarField,
    UnionField,
    InterfaceField,
    ObjectField,
    DateTimeField,
    PointField,
} from "../types";
import Auth from "./Auth";
import Exclude from "./Exclude";

export interface NodeConstructor {
    name: string;
    relationFields: RelationField[];
    cypherFields: CypherField[];
    primitiveFields: PrimitiveField[];
    scalarFields: CustomScalarField[];
    enumFields: CustomEnumField[];
    otherDirectives: DirectiveNode[];
    unionFields: UnionField[];
    interfaceFields: InterfaceField[];
    interfaces: NamedTypeNode[];
    objectFields: ObjectField[];
    dateTimeFields: DateTimeField[];
    pointFields: PointField[];
    auth?: Auth;
    exclude?: Exclude;
    description?: string;
}

class Node {
    public name: string;

    public relationFields: RelationField[];

    public cypherFields: CypherField[];

    public primitiveFields: PrimitiveField[];

    public scalarFields: CustomScalarField[];

    public enumFields: CustomEnumField[];

    public otherDirectives: DirectiveNode[];

    public unionFields: UnionField[];

    public interfaceFields: InterfaceField[];

    public interfaces: NamedTypeNode[];

    public objectFields: ObjectField[];

    public dateTimeFields: DateTimeField[];

    public pointFields: PointField[];

    public auth?: Auth;

    public exclude?: Exclude;

    public description?: string;

    constructor(input: NodeConstructor) {
        this.name = input.name;
        this.relationFields = input.relationFields;
        this.cypherFields = input.cypherFields;
        this.primitiveFields = input.primitiveFields;
        this.scalarFields = input.scalarFields;
        this.enumFields = input.enumFields;
        this.otherDirectives = input.otherDirectives;
        this.unionFields = input.unionFields;
        this.interfaceFields = input.interfaceFields;
        this.interfaces = input.interfaces;
        this.objectFields = input.objectFields;
        this.dateTimeFields = input.dateTimeFields;
        this.pointFields = input.pointFields;
        this.auth = input.auth;
        this.exclude = input.exclude;
        this.description = input.description;
    }
}

export default Node;
