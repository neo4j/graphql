const fetch = require("node-fetch");
const { getIntrospectionQuery, buildClientSchema, printSchema } = require("graphql");
const server = require("./server");

const { GRAPHQL_URL = "http://localhost:4000/graphql" } = process.env;

async function main() {
    try {
        await server.start();

        const result = await fetch(GRAPHQL_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ query: getIntrospectionQuery() }),
        });

        const json = await result.json();

        const errors = json.errors;
        if (errors) {
            throw new Error(errors[0].message);
        }

        const data = json.data;

        const schema = buildClientSchema(data);

        const printed = printSchema(schema);

        // A "Movies" query should have been generated
        const generatedTypeDefsMatch = /Movies/;

        // If not, throw to exit process with 1 and include stack trace
        if (!generatedTypeDefsMatch.test(printed)) {
            throw new Error(`${generatedTypeDefsMatch} was not found in generated typeDefs`);
        }

        console.log("Passed");

        server.stop();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

main();
