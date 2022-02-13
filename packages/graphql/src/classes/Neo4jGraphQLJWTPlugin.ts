abstract class Neo4jGraphQLJWTPlugin {
    rolesPath?: string;
    secret?: string;

    abstract decode<T = any>(jwt: string): Promise<T>;
}

export default Neo4jGraphQLJWTPlugin;
