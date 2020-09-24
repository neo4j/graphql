import { Driver } from "neo4j-driver";

interface Input {
    driver: Driver;
    cypher: string;
    params: any;
}

async function query(input: Input): Promise<any> {
    const session = input.driver.session({ defaultAccessMode: "READ" });

    try {
        const result = await session.run(input.cypher, input.params);

        return result.records.map((r) => r.toObject());
    } finally {
        await session.close();
    }
}

export default query;
