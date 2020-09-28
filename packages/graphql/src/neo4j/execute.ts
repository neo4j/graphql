import { Driver } from "neo4j-driver";

interface Input {
    driver: Driver;
    cypher: string;
    params: any;
    defaultAccessMode: "READ" | "WRITE";
}

async function execute(input: Input): Promise<any> {
    const session = input.driver.session({ defaultAccessMode: input.defaultAccessMode });

    try {
        console.log(input.cypher);
        const result = await session.run(input.cypher, input.params);

        return result.records.map((r) => r.toObject());
    } finally {
        await session.close();
    }
}

export default execute;
