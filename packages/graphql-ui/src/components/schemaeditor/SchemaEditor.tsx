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

import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { Neo4jGraphQL } from "@neo4j/graphql";
import { toGraphQLTypeDefs } from "@neo4j/introspector";
import { GraphQLSchema } from "graphql";
import { Button, Checkbox } from "@neo4j-ndl/react";
import * as neo4j from "neo4j-driver";
import { EditorFromTextArea } from "codemirror";
import { CodeMirror } from "../../utils/utils";
import * as AuthContext from "../../contexts/auth";
import {
    LOCAL_STATE_CHECK_CONSTRAINT,
    LOCAL_STATE_CREATE_CONSTRAINT,
    LOCAL_STATE_DEBUG,
    LOCAL_STATE_TYPE_DEFS,
    SCHEMA_EDITOR_BUILD_BUTTON,
    SCHEMA_EDITOR_INPUT,
} from "../../constants";
import { formatCode, ParserOptions } from "../editor/utils";

const DEFAULT_TYPE_DEFS = `
    # Write your own type definition in the editor here or 
    # generate it automatically from the current Neo4j database (introspection)

    # Example type definition:
    type Movie {
        title: String!
    }
`;

export interface Props {
    onChange: (s: GraphQLSchema) => void;
}

export const SchemaEditor = (props: Props) => {
    const auth = useContext(AuthContext.Context);
    const ref = useRef<HTMLTextAreaElement>();
    const [mirror, setMirror] = useState<EditorFromTextArea | null>(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [isDebugChecked, setIsDebugChecked] = useState<string | null>(localStorage.getItem(LOCAL_STATE_DEBUG));
    const [isCheckConstraintChecked, setIsCheckConstraintChecked] = useState<string | null>(
        localStorage.getItem(LOCAL_STATE_CHECK_CONSTRAINT)
    );
    const [isCreateConstraintChecked, setIsCreateConstraintChecked] = useState<string | null>(
        localStorage.getItem(LOCAL_STATE_CREATE_CONSTRAINT)
    );

    const onChangeDebugCheckbox = (): void => {
        const next = isDebugChecked === "true" ? "false" : "true";
        setIsDebugChecked(next);
        localStorage.setItem(LOCAL_STATE_DEBUG, next);
    };

    const onChangeCheckConstraintCheckbox = (): void => {
        const next = isCheckConstraintChecked === "true" ? "false" : "true";
        setIsCheckConstraintChecked(next);
        localStorage.setItem(LOCAL_STATE_CHECK_CONSTRAINT, next);
    };

    const onChangeCreateConstraintCheckbox = (): void => {
        const next = isCreateConstraintChecked === "true" ? "false" : "true";
        setIsCreateConstraintChecked(next);
        localStorage.setItem(LOCAL_STATE_CREATE_CONSTRAINT, next);
    };

    const formatTheCode = (): void => {
        if (!mirror) return;
        formatCode(mirror, ParserOptions.GRAPH_QL);
    };

    const getStoredTypeDefs = (): string | undefined => {
        const data = localStorage.getItem(LOCAL_STATE_TYPE_DEFS);
        if (!data) return undefined;
        return JSON.parse(data as string);
    };

    const buildSchema = useCallback(
        async (typeDefs: string) => {
            try {
                setLoading(true);

                localStorage.setItem(LOCAL_STATE_TYPE_DEFS, JSON.stringify(typeDefs));

                const neoSchema = new Neo4jGraphQL({
                    typeDefs,
                    driver: auth.driver,
                    config: {
                        enableDebug: isDebugChecked === "true",
                    },
                });

                const schema = await neoSchema.getSchema();

                if (isCheckConstraintChecked === "true") {
                    await neoSchema.assertIndexesAndConstraints({ driver: auth.driver, options: { create: false } });
                }
                if (isCreateConstraintChecked === "true") {
                    await neoSchema.assertIndexesAndConstraints({ driver: auth.driver, options: { create: true } });
                }

                props.onChange(schema);
            } catch (error) {
                const msg = (error as Error).message;
                setError(msg);
            } finally {
                setLoading(false);
            }
        },
        [isDebugChecked, isCheckConstraintChecked, isCreateConstraintChecked]
    );

    const introspect = useCallback(async () => {
        try {
            setLoading(true);

            const sessionFactory = () =>
                auth?.driver?.session({ defaultAccessMode: neo4j.session.READ }) as neo4j.Session;

            const typeDefs = await toGraphQLTypeDefs(sessionFactory);

            mirror?.setValue(typeDefs);
        } catch (error) {
            const msg = (error as Error).message;
            setError(msg);
        } finally {
            setLoading(false);
        }
    }, [buildSchema, mirror]);

    const onSubmit = useCallback(() => {
        if (ref.current?.value) {
            buildSchema(ref.current?.value);
        }
    }, [ref.current?.value, buildSchema]);

    useEffect(() => {
        if (ref.current === null) {
            return;
        }

        const mirror = CodeMirror.fromTextArea(ref.current as HTMLTextAreaElement, {
            lineNumbers: true,
            tabSize: 2,
            mode: "graphql",
            theme: "dracula",
            keyMap: "sublime",
            autoCloseBrackets: true,
            matchBrackets: true,
            showCursorWhenSelecting: true,
            lineWrapping: true,
            foldGutter: {
                // @ts-ignore
                minFoldSize: 4,
            },
            gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
            extraKeys: {
                "Ctrl-L": () => {
                    if (!mirror) return;
                    formatCode(mirror, ParserOptions.GRAPH_QL);
                },
            },
        });
        setMirror(mirror);

        const storedTypeDefs = getStoredTypeDefs() || DEFAULT_TYPE_DEFS;
        if (storedTypeDefs && ref.current) {
            mirror?.setValue(storedTypeDefs);
            ref.current.value = storedTypeDefs;
        }

        mirror.on("change", (e) => {
            if (ref.current) {
                ref.current.value = e.getValue();
            }
        });
    }, [ref]);

    return (
        <div className="flex w-full p-5">
            <div className="flex-1">
                <div className="w-full">
                    {error && (
                        <div
                            className="mt-5 mb-5 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
                            role="alert"
                        >
                            <strong className="font-bold">Holy smokes! </strong>
                            <span className="block sm:inline">{error}</span>
                        </div>
                    )}
                    <div className="flex flex-col">
                        <div>
                            <Button
                                id={SCHEMA_EDITOR_BUILD_BUTTON}
                                fill="outlined"
                                onClick={onSubmit}
                                disabled={loading}
                            >
                                {loading ? "Loading..." : "Build schema"}
                            </Button>

                            <Button fill="outlined" onClick={formatTheCode} disabled={loading}>
                                {loading ? "Loading..." : "Prettify (CTRL+L)"}
                            </Button>

                            <Button fill="outlined" onClick={introspect} disabled={loading}>
                                {loading ? "Loading..." : "Generate typeDefs"}
                            </Button>
                        </div>

                        <div
                            className="mt-5"
                            style={{ width: "100%", height: "800px", overflow: "hidden", resize: "vertical" }}
                        >
                            <textarea
                                id={SCHEMA_EDITOR_INPUT}
                                /* @ts-ignore */
                                ref={ref}
                                style={{ width: "100%", height: "800px" }}
                                disabled={loading}
                            />
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex-1">
                <div className="p-8">
                    <Checkbox
                        label="Enable debug"
                        checked={isDebugChecked === "true"}
                        onChange={onChangeDebugCheckbox}
                    />

                    <Checkbox
                        label="Check constraint"
                        checked={isCheckConstraintChecked === "true"}
                        onChange={onChangeCheckConstraintCheckbox}
                    />

                    <Checkbox
                        label="Create constraint"
                        checked={isCreateConstraintChecked === "true"}
                        onChange={onChangeCreateConstraintCheckbox}
                    />
                </div>
            </div>
        </div>
    );
};
