import React, { Dispatch, useState, SetStateAction } from "react";
import * as neo4j from "neo4j-driver";
import { encrypt, decrypt } from "src/utils/utils";

const LOCAL_STATE_LOGIN = "neo4j.graphql.login";

interface LoginOptions {
    username: string;
    password: string;
    url: string;
}

interface LoginPayload {
    username: string;
    password: string;
    url: string;
}

export interface State {
    driver?: neo4j.Driver;
    login: (options: LoginOptions) => Promise<void>;
    logout: () => void;
}

// @ts-ignore - This is going to be set in the Provider
export const Context = React.createContext<State>();

export function Provider(props: any) {
    let value: State | undefined;
    let setValue: Dispatch<SetStateAction<State>>;

    [value, setValue] = useState<State>({
        login: async (options: LoginOptions) => {
            const auth = neo4j.auth.basic(options.username, options.password);
            const driver = neo4j.driver(options.url, auth);
            await driver.verifyConnectivity();

            const encodedPayload = encrypt({
                username: options.username,
                password: options.password,
                url: options.url,
            } as LoginPayload);
            localStorage.setItem(LOCAL_STATE_LOGIN, JSON.stringify(encodedPayload));

            setValue((v) => ({ ...v, driver }));
        },
        logout: () => {
            localStorage.removeItem(LOCAL_STATE_LOGIN);

            setValue((v) => ({ ...v, driver: undefined }));
        },
    });

    const storedEncryptedPayload = localStorage.getItem(LOCAL_STATE_LOGIN);
    if (storedEncryptedPayload && typeof storedEncryptedPayload === "string") {
        const { encryptedPayload, hashKey } = JSON.parse(storedEncryptedPayload as string);
        const { username, password, url } = decrypt(encryptedPayload, hashKey) as unknown as LoginPayload;

        if (username && password && url && !value.driver) {
            value
                .login({
                    username,
                    password,
                    url,
                })
                .catch(() => {});
        }
    }

    return <Context.Provider value={value as State}>{props.children}</Context.Provider>;
}
