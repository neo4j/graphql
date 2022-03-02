import React from "react";
import { Neo4jGraphQL } from "@neo4j/graphql";
import "./index.css";

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

    return <h1 className="text-3xl font-bold underline italic">Hello world!</h1>;
};

export default App;
