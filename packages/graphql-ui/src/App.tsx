import React from "react";
import { Neo4jGraphQL } from "@neo4j/graphql";

const typeDefs = `
    type Movie {
        name: String!
    }
`;

const App = () => {
    const [neoSchema, setNeoSchema] = React.useState<Neo4jGraphQL | null>(null);
    React.useEffect(() => {
        const tmpNeoSchema = new Neo4jGraphQL({
            typeDefs: typeDefs,
            // @ts-ignore
            driver: {},
        });
        setNeoSchema(tmpNeoSchema);
        tmpNeoSchema
            // @ts-ignore
            .getSchema()
            // @ts-ignore
            .then((schema) => console.log(schema))
            // @ts-ignore
            .catch((e) => console.error(e));
    }, []);

    return <span>TEEEEST</span>;
};

export default App;
