import React from "react";
import { ApolloClient, InMemoryCache, DocumentNode, ApolloLink, ApolloProvider } from "@apollo/client";
import { onError } from "@apollo/client/link/error";
import { setContext } from "@apollo/client/link/context";
import { relayStylePagination } from "@apollo/client/utilities";
import { createHttpLink } from "@apollo/client/link/http";
import { API_URL, JWT_KEY } from "../config";
import constants from "../constants";

type ContextType = { [k: string]: any } & { client: ApolloClient<any> } & {
    query: (args: { query: DocumentNode; variables: any }) => Promise<any>;
    mutate: (args: { mutation: DocumentNode; variables: any }) => Promise<any>;
};

// @ts-ignore
export const Context = React.createContext<ContextType>({});

const httpLink = createHttpLink({
    uri: `${API_URL}/graphql`,
    headers: {
        "keep-alive": "true",
    },
});

const authLink = setContext((_: any, { headers }) => {
    const token = localStorage.getItem(JWT_KEY as string);

    return {
        headers: {
            ...headers,
            authorization: token ? `Bearer ${token}` : "",
        },
    };
});

const client = new ApolloClient({
    link: ApolloLink.from([
        onError(({ graphQLErrors }) => {
            if (graphQLErrors) {
                graphQLErrors.forEach(({ message }) => {
                    if (message.includes("Unauthorized")) {
                        window.location.href = constants.LOG_OUT_PAGE;
                    }
                });
            }
        }),
        authLink.concat(httpLink),
    ]),
    cache: new InMemoryCache({
        typePolicies: {
            User: {
                fields: {
                    createdBlogsConnection: relayStylePagination(),
                },
            },
            Blog: {
                fields: {
                    postsConnection: relayStylePagination(),
                },
            },
        },
    }),
});

async function query(args: { query: DocumentNode; variables: any }) {
    const response = await client.query({
        query: args.query,
        variables: args.variables,
        fetchPolicy: "no-cache",
    });

    if (response.errors && response.errors.length) {
        throw new Error(response.errors[0].message);
    }

    return response.data;
}

async function mutate(args: { mutation: DocumentNode; variables: any }) {
    const response = await client.mutate({
        mutation: args.mutation,
        variables: args.variables,
        fetchPolicy: "no-cache",
    });

    if (response.errors && response.errors.length) {
        throw new Error(response.errors[0].message);
    }

    return response.data;
}

export function Provider(props: any) {
    return (
        // @ts-ignore
        <ApolloProvider client={client}>
            <Context.Provider value={{ client, query, mutate }}>{props.children}</Context.Provider>
        </ApolloProvider>
    );
}
