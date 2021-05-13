import { ResolveTree } from "graphql-parse-resolve-info";
import Relationship from "../../../classes/Relationship";
import { DateTimeField, PointField, PrimitiveField } from "../../../types";
import createRelationshipPropertyElement from "./create-relationship-property-element";

describe("createRelationshipPropertyElement", () => {
    let relationship: Relationship;

    beforeAll(() => {
        relationship = new Relationship({
            name: "TestRelationship",
            type: "TEST_RELATIONSHIP",
            fields: [
                {
                    fieldName: "int",
                    typeMeta: {
                        name: "Int",
                        array: false,
                        required: true,
                        pretty: "Int!",
                        arrayTypePretty: "",
                        input: {
                            create: {
                                type: "Int",
                                pretty: "Int!",
                            },
                            update: {
                                type: "Int",
                                pretty: "Int",
                            },
                            where: {
                                type: "Int",
                                pretty: "Int",
                            },
                        },
                    },
                    otherDirectives: [],
                    arguments: [],
                    description: undefined,
                    readonly: false,
                    writeonly: false,
                } as PrimitiveField,
                {
                    fieldName: "datetime",
                    typeMeta: {
                        name: "DateTime",
                        array: false,
                        required: true,
                        pretty: "DateTime!",
                        arrayTypePretty: "",
                        input: {
                            create: {
                                type: "DateTime",
                                pretty: "DateTime!",
                            },
                            update: {
                                type: "DateTime",
                                pretty: "DateTime",
                            },
                            where: {
                                type: "DateTime",
                                pretty: "DateTime",
                            },
                        },
                    },
                    otherDirectives: [],
                    arguments: [],
                    description: undefined,
                    readonly: false,
                    writeonly: false,
                } as DateTimeField,
                {
                    fieldName: "point",
                    typeMeta: {
                        name: "Point",
                        array: false,
                        required: true,
                        pretty: "Point!",
                        arrayTypePretty: "",
                        input: {
                            create: {
                                type: "Point",
                                pretty: "PointInput!",
                            },
                            update: {
                                type: "Point",
                                pretty: "PointInput",
                            },
                            where: {
                                type: "PointInput",
                                pretty: "PointInput",
                            },
                        },
                    },
                    otherDirectives: [],
                    arguments: [],
                    description: undefined,
                    readonly: false,
                    writeonly: false,
                } as PointField,
            ],
        });
    });

    test("returns an element for a primitive property", () => {
        const resolveTree: ResolveTree = {
            alias: "int",
            name: "int",
            args: {},
            fieldsByTypeName: {},
        };

        const element = createRelationshipPropertyElement({ resolveTree, relationship, relationshipVariable: "this" });

        expect(element).toEqual("int: this.int");
    });

    test("returns an element for a datetime property", () => {
        const resolveTree: ResolveTree = {
            alias: "datetime",
            name: "datetime",
            args: {},
            fieldsByTypeName: {},
        };

        const element = createRelationshipPropertyElement({ resolveTree, relationship, relationshipVariable: "this" });

        expect(element).toEqual(
            'datetime: apoc.date.convertFormat(toString(this.datetime), "iso_zoned_date_time", "iso_offset_date_time")'
        );
    });

    test("returns an element for a point property", () => {
        const resolveTree: ResolveTree = {
            name: "point",
            alias: "point",
            args: {},
            fieldsByTypeName: {
                Point: {
                    crs: {
                        alias: "crs",
                        name: "crs",
                        args: {},
                        fieldsByTypeName: {},
                    },
                    point: {
                        alias: "point",
                        name: "point",
                        args: {},
                        fieldsByTypeName: {},
                    },
                },
            },
        };

        const element = createRelationshipPropertyElement({ resolveTree, relationship, relationshipVariable: "this" });

        expect(element).toEqual("point: { point: this.point, crs: this.point.crs }");
    });
});
