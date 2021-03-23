import React, { useState, useContext } from "react";
import * as config from "../config";

interface Auth {
    isLoggedIn: boolean;
    getId: () => string | undefined;
    getSetValue: (...args: any) => (...yargs: any) => void;
}

// @ts-ignore
const Context = React.createContext<Auth>({});

function getId(): string | undefined {
    const key = localStorage.getItem(config.JWT_KEY as string);

    if (!key) {
        return;
    }

    return JSON.parse(window.atob(key.split(".")[1])).sub;
}

function Provider(props: any) {
    let value;
    let setValue: (...args: any) => void;

    [value, setValue] = useState({
        isLoggedIn: Boolean(localStorage.getItem(config.JWT_KEY as string)),
        getId,
        getSetValue: () => setValue,
    });

    return <Context.Provider value={value}>{props.children}</Context.Provider>;
}

export { Context, Provider };
