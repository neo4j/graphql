import { ResolveTree } from "graphql-parse-resolve-info";
import { DateTimeField } from "../../../types";
import createDatetimeElement from "./create-datetime-element";

describe("createDatetimeElement", () => {
    test("returns projection element for single datetime value", () => {
        const resolveTree: ResolveTree = {
            name: "datetime",
            alias: "datetime",
            args: {},
            fieldsByTypeName: {},
        };

        const field: DateTimeField = {
            // @ts-ignore
            typeMeta: {
                name: "Point",
            },
        };

        const element = createDatetimeElement({
            resolveTree,
            field,
            variable: "this",
        });

        expect(element).toEqual(
            'datetime: apoc.date.convertFormat(toString(this.datetime), "iso_zoned_date_time", "iso_offset_date_time")'
        );
    });

    test("returns projection element for array of datetime values", () => {
        const resolveTree: ResolveTree = {
            name: "datetimes",
            alias: "datetimes",
            args: {},
            fieldsByTypeName: {},
        };

        const field: DateTimeField = {
            // @ts-ignore
            typeMeta: {
                name: "Point",
                array: true,
            },
        };

        const element = createDatetimeElement({
            resolveTree,
            field,
            variable: "this",
        });

        expect(element).toEqual(
            'datetimes: [ dt in this.datetimes | apoc.date.convertFormat(toString(dt), "iso_zoned_date_time", "iso_offset_date_time") ]'
        );
    });
});
