import { request } from "graphql-request";
import { LoginPayload } from "./types";

const GET_DATABASES_QUERY = `
    query {
        workspace {
            projects {
            name
                graphs {
                    name
                    status
                    connection {
                        info {
                            version
                            edition
                        }
                        principals {
                            protocols {
                                bolt {
                                    tlsLevel
                                    url
                                    username
                                    password
                                }
                            }
                        }
                    }
                }
            }
        }
    }
`;

export const resolveNeo4jDesktopLoginPayload = async (): Promise<LoginPayload | null> => {
    const url = new URL(window.location.href);
    const apiEndpoint = url.searchParams.get("neo4jDesktopApiUrl");
    const clientId = url.searchParams.get("neo4jDesktopGraphAppClientId");

    if (!apiEndpoint && !clientId) {
        return null;
    }
    try {
        const data = await request({
            url: apiEndpoint || "",
            document: GET_DATABASES_QUERY,
            requestHeaders: {
                clientId: clientId || "",
            },
        });
        if (!data) {
            return null;
        }

        const graphsData = data?.workspace?.projects
            .map((project) => ({
                graphs: project.graphs.filter((graph) => graph.status === "ACTIVE"),
            }))
            .reduce((acc, { graphs }) => acc.concat(graphs), []);

        if (!graphsData.length) {
            return null;
        }

        const { url: boltUrl, username, password } = graphsData[0].connection.principals.protocols.bolt;
        return {
            url: boltUrl,
            username,
            password,
        };
    } catch (error) {
        // eslint-disable-next-line no-console
        console.log("Error while fetching and processing Neo4jDesktop GraphQL API, e: ", error);
        return null;
    }
};
