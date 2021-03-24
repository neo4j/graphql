import { Node } from "../../classes";
import findResolver from "./read";

describe("Read resolver", () => {
    test("should return the correct; type, args and resolve", () => {
        // @ts-ignore
        const node: Node = {
            // @ts-ignore
            name: "Movie",
        };

        const result = findResolver({ node });
        expect(result.type).toEqual(`[Movie]!`);
        expect(result.resolve).toBeInstanceOf(Function);
        expect(result.args).toMatchObject({
            where: `MovieWhere`,
            options: `MovieOptions`,
        });
    });
});
