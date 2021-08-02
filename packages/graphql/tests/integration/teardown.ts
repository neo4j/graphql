import neo4j from "./neo4j";

const teardown = async () => {
    const driver = await neo4j();
    const session = driver.session();

    try {
        console.log("Clearing down database...");
        await session.run("MATCH (n) DETACH DELETE n");
    } catch (e) {
        console.log("Encountered an error whilst clearing down database!");
        throw e;
    } finally {
        await session.close();
        await driver.close();
    }
};

// eslint-disable-next-line no-void
void teardown().then(() => console.log("Successfully cleared down database."));
