import fetch from "make-fetch-happen";

export const ROUTER_URL = "http://localhost:4013/";
const PING_QUERY = "query { __typename }";

const ROUTER_HEALTH_URL = "http://localhost:8088/health";
const PRODUCTS_URL = "http://localhost:4011/";

const INVENTORY_URL = "http://localhost:4010/";
const USERS_URL = "http://localhost:4012/";

export async function graphqlRequest(
    url: string,
    req: {
        query: string;
        variables?: { [key: string]: any };
        operationName?: string;
    },
    headers?: { [key: string]: any },
) {
    const resp = await fetch(url, {
        headers: {
            accept: "application/json", // required because Yoga's default content-type is `application/graphql-response+json` as per the spec
            "content-type": "application/json",
            ...(headers ?? {}),
        },
        method: "POST",
        body: JSON.stringify(req),
    });

    if (resp.ok && resp.headers.get("content-type")?.startsWith("application/json")) {
        return resp.json();
    }

    return resp.text();
}

export function productsRequest(
    req: {
        query: string;
        variables?: { [key: string]: any };
        operationName?: string;
    },
    headers?: { [key: string]: any },
) {
    return graphqlRequest(PRODUCTS_URL, req, headers);
}

export function routerRequest(
    req: {
        query: string;
        variables?: { [key: string]: any };
        operationName?: string;
    },
    headers?: { [key: string]: any },
) {
    return graphqlRequest(ROUTER_URL, req, headers);
}

export async function healthcheckAll(libraryName: string): Promise<boolean> {
    const routerUp = await healthcheckRouter();
    if (!routerUp) {
        return false;
    }

    return healthcheck(libraryName, PRODUCTS_URL);
}

export async function healtcheckSupergraph(url: string): Promise<boolean> {
    const routerUp = await healthcheckRouter();
    return (
        routerUp &&
        (await healthcheck("inventory", INVENTORY_URL)) &&
        (await healthcheck("users", USERS_URL)) &&
        healthcheck("products", url)
    );
}

export async function healthcheckRouter(): Promise<boolean> {
    console.log("router health check", ROUTER_HEALTH_URL);
    try {
        const routerHealthcheck = await fetch(ROUTER_HEALTH_URL, {
            retry: { retries: 10, maxTimeout: 1000 },
        });

        if (!routerHealthcheck.ok) {
            console.log("router failed to start");
            return false;
        }
        return true;
    } catch (err) {
        console.error("router faield to start", err);
        return false;
    }
}

export async function healthcheck(appName: string, url: string): Promise<boolean> {
    let attempts = 100;
    let lastError;
    while (attempts--) {
        console.log(`${appName} health check`, url);
        try {
            const subgraphHealthcheck = await graphqlRequest(url, {
                query: PING_QUERY,
            });

            if (subgraphHealthcheck.data?.__typename) {
                return true;
            } else {
                lastError = subgraphHealthcheck.errors;
            }
        } catch (e) {
            lastError = e;
        }

        await new Promise((r) => setTimeout(r, 1000));
    }

    console.log(`${appName} failed to start`);
    console.log(lastError);
    return false;
}
