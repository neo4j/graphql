import { ResolveTree } from "graphql-parse-resolve-info";
import { PointField } from "../../../types";
import createPointElement from "./create-point-element";

describe("createPointElement", () => {
    test("returns projection element for single point value", () => {
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

        const field: PointField = {
            // @ts-ignore
            typeMeta: {
                name: "Point",
            },
        };

        const element = createPointElement({
            resolveTree,
            field,
            variable: "this",
        });

        expect(element).toEqual("point: { point: this.point, crs: this.point.crs }");
    });

    test("returns projection element for array of point values", () => {
        const resolveTree: ResolveTree = {
            name: "points",
            alias: "points",
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

        const field: PointField = {
            // @ts-ignore
            typeMeta: {
                name: "Point",
                array: true,
            },
        };

        const element = createPointElement({
            resolveTree,
            field,
            variable: "this",
        });

        expect(element).toEqual("points: [p in this.points | { point:p, crs: p.crs }]");
    });
});
