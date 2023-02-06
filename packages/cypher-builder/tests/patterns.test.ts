import Cypher from "../src";
import { NewRelationshipRef } from "../src/references/RelationshipRef";
import { TestClause } from "../src/utils/TestClause";

describe("Patterns", () => {
    test("Simple relationship Pattern", () => {
        const a = new Cypher.Node();
        const b = new Cypher.Node();
        const rel = new NewRelationshipRef({
            type: "ACTED_IN",
        });

        const query = new TestClause(a.related(rel).to(b));
        const queryResult = query.build();
        expect(queryResult.cypher).toMatchInlineSnapshot(`"(this0)-[this1:\`ACTED_IN\`]->(this2)"`);

        expect(queryResult.params).toMatchInlineSnapshot(`Object {}`);
    });

    test("Simple Pattern with properties", () => {
        const a = new Cypher.Node({
            labels: ["Person", "Actor"],
            properties: {
                name: new Cypher.Param("Arthur"),
                surname: new Cypher.Param("Dent"),
            },
        });
        const b = new Cypher.Node();
        const rel = new NewRelationshipRef({
            type: "ACTED_IN",
            properties: {
                roles: new Cypher.Param(["neo"]),
            },
        });

        const query = new TestClause(a.related(rel).to(b));
        const queryResult = query.build();
        expect(queryResult.cypher).toMatchInlineSnapshot(
            `"(this0:\`Person\`:\`Actor\` { name: $param0, surname: $param1 })-[this1:\`ACTED_IN\` { roles: $param2 }]->(this2)"`
        );

        expect(queryResult.params).toMatchInlineSnapshot(`
            Object {
              "param0": "Arthur",
              "param1": "Dent",
              "param2": Array [
                "neo",
              ],
            }
        `);
    });

    test("Long relationship Pattern", () => {
        const a = new Cypher.Node();
        const b = new Cypher.Node();
        const c = new Cypher.Node({ labels: ["TestLabel"] });

        const rel1 = new NewRelationshipRef({
            type: "ACTED_IN",
        });
        const rel2 = new NewRelationshipRef({
            type: "ACTED_IN",
        });

        const query = new TestClause(a.related(rel1).to(b).related(rel2).to(c));
        const queryResult = query.build();
        expect(queryResult.cypher).toMatchInlineSnapshot(
            `"(this0)-[this1:\`ACTED_IN\`]->(this2)-[this3:\`ACTED_IN\`]->(this4:\`TestLabel\`)"`
        );

        expect(queryResult.params).toMatchInlineSnapshot(`Object {}`);
    });
});
