import React, { Dispatch, useState, SetStateAction } from "react";
import * as neo4j from "neo4j-driver";

const LOCAL_STATE_USERNAME = "username";
const LOCAL_STATE_PASSWORD = "password";
const LOCAL_STATE_URL = "url";

interface LoginOptions {
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

            // TODO - Encode
            localStorage.setItem(LOCAL_STATE_USERNAME, options.username);
            localStorage.setItem(LOCAL_STATE_PASSWORD, options.password);
            localStorage.setItem(LOCAL_STATE_URL, options.url);

            setValue((v) => ({ ...v, driver }));
        },
        logout: () => {
            localStorage.removeItem(LOCAL_STATE_USERNAME);
            localStorage.removeItem(LOCAL_STATE_PASSWORD);
            localStorage.removeItem(LOCAL_STATE_URL);

            setValue((v) => ({ ...v, driver: undefined }));
        },
    });

    // TODO - Decode
    const username = localStorage.getItem(LOCAL_STATE_USERNAME);
    const password = localStorage.getItem(LOCAL_STATE_PASSWORD);
    const url = localStorage.getItem(LOCAL_STATE_URL);

    if (username && password && url && !value.driver) {
        value
            .login({
                username,
                password,
                url,
            })
            .catch(() => {});
    }

    return <Context.Provider value={value as State}>{props.children}</Context.Provider>;
}
