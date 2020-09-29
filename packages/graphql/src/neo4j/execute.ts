import { Driver } from "neo4j-driver";

async function execute(input: {
    driver: Driver;
    cypher: string;
    params: any;
    defaultAccessMode: "READ" | "WRITE";
}): Promise<any> {
    const session = input.driver.session({ defaultAccessMode: input.defaultAccessMode });

    try {
        const result = await session.run(input.cypher, input.params);

        return result.records.map((r) => r.toObject());
    } finally {
        await session.close();
    }
}

export default execute;
