abstract class Neo4jGraphQLJWTPlugin {
    rolesPath?: string;
    secret?: string;

    abstract decode(context: any): Promise<any>;
}

export default Neo4jGraphQLJWTPlugin;
