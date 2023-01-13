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
import { FormInput } from "./FormInput";
import { Button, HeroIcon, LoadingSpinner } from "@neo4j-ndl/react";
import { DEFAULT_BOLT_URL, DEFAULT_USERNAME } from "../../constants";
// @ts-ignore - SVG Import
import Icon from "../../assets/neo4j-color.svg";
import { AuthContext } from "../../contexts/auth";
import { getConnectUrlSearchParamValue } from "../../contexts/utils";
import { ProTooltip } from "../../components/ProTooltip";
import { getURLProtocolFromText } from "../../utils/utils";

export const Login = () => {
    const auth = useContext(AuthContext);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>("");

    const {
        url: searchParamUrl,
        username: searchParamUsername,
        password: searchParamPassword,
    } = getConnectUrlSearchParamValue() || {};
    const [url, setUrl] = useState<string>(searchParamUrl || DEFAULT_BOLT_URL);
    const [username, setUsername] = useState<string>(searchParamUsername || DEFAULT_USERNAME);
    const [password, setPassword] = useState<string>(searchParamPassword || "");

    const showWarningToolTip =
        window.location.protocol.includes("https") && !getURLProtocolFromText(url).includes("+s");

    const onSubmit = useCallback(
        async (event: React.FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            setLoading(true);

            try {
                const data = new FormData(event.currentTarget);
                const password = data.get("password") as string;

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
        [url, username]
    );

    const WarningToolTip = ({ text }: { text: React.ReactNode }): JSX.Element => {
        return (
            <ProTooltip
                tooltipText={text}
                arrowPositionOverride="left"
                blockVisibility={false}
                width={320}
                left={36}
                top={-58}
            >
                <HeroIcon className="n-text-warning-50" iconName="ExclamationIcon" type="outline" />
            </ProTooltip>
        );
    };

    if (auth.isInitiating) {
        return (
            <div className="h-screen flex justify-center items-center bg-white">
                <LoadingSpinner size="large" />
            </div>
        );
    }

    return (
        <div data-test-login-form className="grid place-items-center h-screen bg-white">
            <div className="w-login flex flex-col align-center justify-center bg-white shadow-2xl rounded p-8">
                <div className="mb-6 text-center">
                    <img src={Icon} alt="Neo4j Logo" className="h-12 w-12 mb-3 mx-auto" />
                    <h2 className="mt-1 text-3xl">Neo4j GraphQL Toolbox</h2>
                </div>
                {/* eslint-disable-next-line @typescript-eslint/no-misused-promises */}
                <form onSubmit={onSubmit} className="flex flex-col gap-4">
                    <FormInput
                        testtag="data-test-login-username"
                        label="Username"
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

                    <FormInput
                        testtag="data-test-login-url"
                        label="Connection URI"
                        name="url"
                        value={url}
                        onChange={(event) => setUrl(event.currentTarget.value)}
                        placeholder={DEFAULT_BOLT_URL}
                        required={true}
                        type="text"
                        disabled={loading}
                    />

                    <div className="flex items-center">
                        <Button
                            data-test-login-button
                            color="neutral"
                            fill="outlined"
                            type="submit"
                            loading={loading}
                            disabled={loading}
                            // eslint-disable-next-line @typescript-eslint/no-empty-function
                            onClick={() => {}} // INFO: To prevent warning in browser console
                        >
                            Connect
                        </Button>

                        {showWarningToolTip ? (
                            <div className="ml-3 h-7 w-7">
                                <WarningToolTip
                                    text={
                                        <span>
                                            With the current Connection URI value the Neo4j driver will be configured to
                                            use insecure WebSocket on a HTTPS web page. WebSockets might not work in a
                                            mixed content environment. Please consider accessing the Neo4j database
                                            using either the bolt+s or neo4j+s protocol. More information:{" "}
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
                    </div>

                    {error && (
                        <p className="mt-4 inline-block align-baseline font-bold text-sm text-red-500">{error}</p>
                    )}
                </form>
            </div>
        </div>
    );
};
