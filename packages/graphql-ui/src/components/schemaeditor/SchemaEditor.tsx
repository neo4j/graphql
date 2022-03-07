import { useCallback, useContext, useEffect, useRef, useState, Fragment } from "react";
import { Neo4jGraphQL } from "@neo4j/graphql";
import { toGraphQLTypeDefs } from "@neo4j/introspector";
import { GraphQLSchema } from "graphql";
import { Button } from "@neo4j-ndl/react";
import * as neo4j from "neo4j-driver";
import { CodeMirror } from "../../util";
import * as AuthContext from "../../contexts/auth";
import { LOCAL_STATE_TYPE_DEFS } from "src/constants/constants";

export interface Props {
    onChange: (s: GraphQLSchema) => void;
}

export const SchemaEditor = (props: Props) => {
    const auth = useContext(AuthContext.Context);
    const ref = useRef<HTMLTextAreaElement>();
    const mirror = useRef<CodeMirror.EditorFromTextArea>();
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const getStoredTypeDefs = (): string | undefined => {
        const data = localStorage.getItem(LOCAL_STATE_TYPE_DEFS);
        if (!data) return undefined;
        return JSON.parse(data as string);
    };

    const buildSchema = useCallback(async (typeDefs: string) => {
        try {
            setLoading(true);

            localStorage.setItem(LOCAL_STATE_TYPE_DEFS, JSON.stringify(typeDefs));

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                driver: auth.driver,
            });

            const schema = await neoSchema.getSchema();

            props.onChange(schema);
        } catch (error) {
            const msg = (error as Error).message;
            setError(msg);
        } finally {
            setLoading(false);
        }
    }, []);

    const introspect = useCallback(async () => {
        try {
            setLoading(true);

            const sessionFactory = () =>
                auth?.driver?.session({ defaultAccessMode: neo4j.session.READ }) as neo4j.Session;

            const typeDefs = await toGraphQLTypeDefs(sessionFactory);

            mirror.current?.setValue(typeDefs);
        } catch (error) {
            const msg = (error as Error).message;
            setError(msg);
        } finally {
            setLoading(false);
        }
    }, [buildSchema]);

    const onSubmit = useCallback(() => {
        if (ref.current?.value) {
            buildSchema(ref.current?.value);
        }
    }, [ref.current?.value, buildSchema]);

    useEffect(() => {
        if (ref.current === null) {
            return;
        }

        mirror.current = CodeMirror.fromTextArea(ref.current as HTMLTextAreaElement, {
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
        });

        const storedTypeDefs = getStoredTypeDefs();
        if (storedTypeDefs && ref.current) {
            mirror.current?.setValue(storedTypeDefs);
            ref.current.value = storedTypeDefs;
        }

        mirror.current.on("change", (e) => {
            if (ref.current) {
                ref.current.value = e.getValue();
            }
        });
    }, [ref]);

    return (
        <div className="flex w-1/2 mx-auto">
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
                <div className="flex justify-between">
                    <Button fill="outlined" onClick={onSubmit} disabled={loading}>
                        {loading ? "Loading..." : "Build schema"}
                    </Button>

                    <Button fill="outlined" onClick={introspect} disabled={loading}>
                        {loading ? "Loading..." : "Generate typeDefs"}
                    </Button>
                </div>

                <div
                    className="mt-5"
                    style={{ width: "100%", height: "800px", overflow: "hidden", resize: "vertical" }}
                >
                    {/* @ts-ignore */}
                    <textarea ref={ref} style={{ width: "100%", height: "800px" }} disabled={loading} />
                </div>
            </div>
        </div>
    );
};
