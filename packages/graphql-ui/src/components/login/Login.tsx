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

import { useCallback } from "react";
import { useContext, useState } from "react";
import * as AuthContext from "../../contexts/auth";
import { FormInput } from "./FormInput";
import { Button } from "@neo4j-ndl/react";
import { LOGIN_BUTTON, LOGIN_PASSWORD_INPUT, LOGIN_URL_INPUT, LOGIN_USERNAME_INPUT } from "../../constants";

const Login = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const auth = useContext(AuthContext.Context);

    const onSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);

        (async () => {
            try {
                const data = new FormData(event.currentTarget);
                const username = data.get("username") as string;
                const password = data.get("password") as string;
                const url = data.get("url") as string;

                await auth.login({
                    username,
                    password,
                    url,
                });
            } catch (error) {
                setLoading(false);
                setError((error as Error).message as string);
            }
        })();
    }, []);

    return (
        <div className="grid place-items-center h-screen n-bg-neutral-40">
            <div className="w-full max-w-md">
                <form onSubmit={onSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
                    <div className="mb-4">
                        <FormInput
                            id={LOGIN_USERNAME_INPUT}
                            label="Username"
                            name="username"
                            placeholder="admin"
                            required={true}
                            type="text"
                            disabled={loading}
                        ></FormInput>
                    </div>
                    <div className="mb-6">
                        <FormInput
                            id={LOGIN_PASSWORD_INPUT}
                            label="Password"
                            name="password"
                            placeholder="password"
                            required={true}
                            type="password"
                            disabled={loading}
                        ></FormInput>
                    </div>
                    <div className="mb-8">
                        <FormInput
                            id={LOGIN_URL_INPUT}
                            label="Bolt URL"
                            name="url"
                            placeholder="bolt://localhost:7687"
                            defaultValue="bolt://localhost:7687"
                            required={true}
                            type="text"
                            disabled={loading}
                        ></FormInput>
                    </div>
                    <div className="flex items-center justify-between">
                        <Button id={LOGIN_BUTTON} fill="outlined" type="submit" disabled={loading}>
                            {loading ? <>Logging In</> : <span>Sign In</span>}
                        </Button>
                    </div>

                    {error && (
                        <p className="mt-4 inline-block align-baseline font-bold text-sm text-red-500">{error}</p>
                    )}
                </form>
            </div>
        </div>
    );
};

export default Login;
