/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 *
 * This file is part of Neo4j.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { useCallback, useContext, useState } from "react";

import { Banner, Button, Tooltip } from "@neo4j-ndl/react";
import { ExclamationTriangleIconOutline } from "@neo4j-ndl/react/icons";

// @ts-ignore - PNG Import
import neo4jIcon from "../../assets/neo4j-full-color.png";
import { DEFAULT_BOLT_URL, DEFAULT_USERNAME } from "../../constants";
import { AuthContext } from "../../contexts/auth";
import { getConnectUrlSearchParamValue } from "../../contexts/utils";
import { getURLProtocolFromText } from "../../utils/utils";
import { FormInput } from "./FormInput";

export const Login = () => {
    const auth = useContext(AuthContext);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>("");
    const { url: searchParamUrl, username: searchParamUsername } = getConnectUrlSearchParamValue() || {};
    const [url, setUrl] = useState<string>(searchParamUrl || DEFAULT_BOLT_URL);
    const [username, setUsername] = useState<string>(searchParamUsername || DEFAULT_USERNAME);
    const [password, setPassword] = useState<string>("");
    const showWarningToolTip =
        window.location.protocol.includes("https") && !getURLProtocolFromText(url).includes("+s");

    const onSubmit = useCallback(
        async (event: React.FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            setLoading(true);

            try {
                await auth.login({
                    username,
                    password,
                    url,
                });
            } catch (error) {
                setError((error as Error).message);
            } finally {
                setLoading(false);
            }
        },
        [url, username, password]
    );

    const WarningToolTip = ({ text }: { text: React.ReactNode }): JSX.Element => {
        const [isHovering, setIsHovering] = useState<boolean>(false);

        return (
            <div
                className="pr-2"
                onMouseOver={() => setIsHovering(true)}
                onFocus={() => setIsHovering(true)}
                onMouseOut={() => setIsHovering(false)}
                onBlur={() => setIsHovering(false)}
            >
                <ExclamationTriangleIconOutline className="text-lemon-55 h-7 w-7" />
                {isHovering ? (
                    <Tooltip
                        arrowPosition="left"
                        className="absolute mt-[-5.2rem] ml-[2.2rem] z-20"
                        style={{ width: "20rem" }}
                    >
                        {text}
                    </Tooltip>
                ) : null}
            </div>
        );
    };

    return (
        <div data-test-login-form className="grid place-items-center h-screen bg-palette-neutral-bg-default login-bg">
            <div className="w-[600px] min-h-[740px] flex flex-col justify-start shadow-overlay rounded-3xl py-8 px-24 bg-neutral-10">
                <img src={neo4jIcon} alt="Neo4j Logo" className="mx-auto mt-4 h-14" />

                <h2 className="h2 text-3xl text-center mt-16 mb-8">Neo4j GraphQL Toolbox</h2>

                {error && (
                    <Banner
                        className="mb-8"
                        title="Neo4j Error"
                        description={error}
                        icon
                        type="danger"
                        closeable={false}
                    />
                )}

                <form
                    // eslint-disable-next-line @typescript-eslint/no-misused-promises
                    onSubmit={onSubmit}
                    className="flex flex-col items-center gap-4 mt-auto mb-24"
                >
                    <FormInput
                        testtag="data-test-login-url"
                        label="Connection URL"
                        name="url"
                        value={url}
                        onChange={(event) => setUrl(event.currentTarget.value)}
                        placeholder={DEFAULT_BOLT_URL}
                        required={true}
                        type="text"
                        disabled={loading}
                    />
                    {showWarningToolTip ? (
                        <div className="absolute ml-[-28rem] mt-[2.5rem]">
                            <WarningToolTip
                                text={
                                    <span>
                                        This protocol will not establish a secure connection. Please consider accessing
                                        the Neo4j database using either the bolt+s or neo4j+s protocol. More
                                        information:{" "}
                                        <a
                                            className="underline"
                                            href="https://neo4j.com/developer/javascript/#driver-configuration"
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            here
                                        </a>
                                    </span>
                                }
                            />
                        </div>
                    ) : null}

                    <FormInput
                        testtag="data-test-login-username"
                        label="Database user"
                        name="username"
                        placeholder="neo4j"
                        value={username}
                        onChange={(event) => setUsername(event.currentTarget.value)}
                        required={true}
                        type="text"
                        disabled={loading}
                        autoComplete="username"
                    />

                    <FormInput
                        testtag="data-test-login-password"
                        label="Password"
                        name="password"
                        placeholder="password"
                        value={password}
                        onChange={(event) => setPassword(event.currentTarget.value)}
                        required={true}
                        type="password"
                        disabled={loading}
                        autoComplete="current-password"
                    />

                    <Button
                        data-test-login-button
                        className="w-60 mt-8"
                        fill="filled"
                        type="submit"
                        size="large"
                        loading={loading}
                        disabled={loading || !url || !username || !password}
                    >
                        Connect
                    </Button>
                </form>
            </div>
        </div>
    );
};
