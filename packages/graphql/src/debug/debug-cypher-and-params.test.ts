import type { Debugger } from "debug";
import Debug from "debug";
import { debugCypherAndParams } from "./debug-cypher-and-params";

describe("debugCypherAndParams", () => {
    let log: jest.Mock;
    let debug: Debugger;

    beforeEach(() => {
        log = jest.fn();

        debug = Debug("test");
        debug.enabled = true;
        // comment out to visually inspect output in console
        debug.log = log;
    });

    test("logs cypher query and params nicely", () => {
        debugCypherAndParams(
            debug,
            `MATCH (this)
        WHERE this.id = $id
        RETURN this`,
            {
                id: 1,
            }
        );

        expect(log.mock.calls[0][0]).toMatchInlineSnapshot(`"  [38;5;26;1mtest [0mexecuting cypher"`);
        expect(log.mock.calls[1][0]).toMatchInlineSnapshot(`
            "  [38;5;26;1mtest [0mMATCH (this)
              [38;5;26;1mtest [0m        WHERE this.id = $id
              [38;5;26;1mtest [0m        RETURN this"
        `);
        expect(log.mock.calls[2][0]).toMatchInlineSnapshot(`"  [38;5;26;1mtest [0mcypher params: { id: [33m1[39m }"`);
    });
});
