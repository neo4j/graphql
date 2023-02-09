import Cypher from "../..";

test("Match node with mathematical operator", () => {
    const yearParam = new Cypher.Param(2000);

    const movieNode = new Cypher.Node({
        labels: ["Movie"],
    });

    const matchQuery = new Cypher.Match(movieNode)
        .where(Cypher.eq(movieNode.property("released"), Cypher.plus(new Cypher.Literal(10), yearParam)))
        .return(movieNode);

    const queryResult = matchQuery.build();
    expect(queryResult.cypher).toMatchInlineSnapshot(`
        "MATCH (this0:\`Movie\`)
        WHERE this0.released = 10 + $param0
        RETURN this0"
    `);

    expect(queryResult.params).toMatchInlineSnapshot(`
        Object {
          "param0": 2000,
        }
    `);
});
