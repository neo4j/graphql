/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { TestHelper } from "../utils/tests-helper";

/*
 * File not imported in project, and to be used in test pipelines to teardown target database.
 *
 *   `ts-node tests/integration/teardown.ts`
 */

const teardown = async () => {
    const testHelper = new TestHelper();

    try {
        console.log("Clearing down database...");
        await testHelper.executeCypher("MATCH (n) DETACH DELETE n");
    } finally {
        await testHelper.close();
    }
};

teardown().then(
    () => console.log("Successfully cleared down database."),
    (reason) => console.log(`Error encountered whilst clearing down database: ${reason}`)
);
