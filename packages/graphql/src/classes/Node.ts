import { DirectiveNode, NamedTypeNode, GraphQLSchema } from "graphql";
import {
    RelationField,
    CypherField,
    PrimitiveField,
    CustomEnumField,
    CustomScalarField,
    UnionField,
    InterfaceField,
    ObjectField,
    BaseField,
    DateTimeField,
} from "../types";
import Auth from "./Auth";
import Model from "./Model";
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
    auth?: Auth;
    getGraphQLSchema: () => GraphQLSchema;
    exclude?: Exclude;
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

    public auth?: Auth;

    public model: Model;

    public exclude?: Exclude;

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
        this.auth = input.auth;
        this.exclude = input.exclude;

        const selectionSet = `
            {
                ${
                    [this.primitiveFields, this.scalarFields, this.enumFields].reduce(
                        (res: string[], v: BaseField[]) => [...res, ...v.map((x) => x.fieldName)],
                        []
                    ) as string[]
                }
            }
        `;

        this.model = new Model({ name: this.name, selectionSet, getGraphQLSchema: input.getGraphQLSchema });
    }
}

export default Node;
