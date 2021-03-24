import { Node } from "../../classes";
import deleteResolver from "./delete";

describe("Delete resolver", () => {
    test("should return the correct; type, args and resolve", () => {
        // @ts-ignore
        const node: Node = {
            // @ts-ignore
            name: "Movie",
            relationFields: [],
        };

        const result = deleteResolver({ node });
        expect(result.type).toEqual(`DeleteInfo!`);
        expect(result.resolve).toBeInstanceOf(Function);
        expect(result.args).toMatchObject({
            where: `MovieWhere`,
        });
    });
});
