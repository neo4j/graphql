import { useEffect, useRef, useState } from "react";
import { GraphQLSchema } from "graphql";
import { CodeMirror } from "../../utils/utils";
import { EditorFromTextArea } from "codemirror";
import { EDITOR_QUERY_INPUT } from "src/constants";

export interface Props {
    schema: GraphQLSchema;
    query: string;
    initialQueryValue?: string;
    executeQuery: (override?: string) => Promise<void>;
    onChangeQuery: (query: string) => void;
}

export const GraphQLQueryEditor = ({ schema, initialQueryValue, query, executeQuery, onChangeQuery }: Props) => {
    const [mirror, setMirror] = useState<EditorFromTextArea | null>(null);
    const ref = useRef<HTMLTextAreaElement | null>(null);

    useEffect(() => {
        if (ref.current === null) {
            return;
        }

        const element = ref.current as HTMLTextAreaElement;

        const showHint = () => {
            mirror.showHint({
                completeSingle: true,
                container: element.parentElement,
            });
        };

        const mirror = CodeMirror.fromTextArea(ref.current, {
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
            lint: {
                // @ts-ignore
                schema: schema,
                validationRules: null,
            },
            hintOptions: {
                schema: schema,
                closeOnUnfocus: false,
                completeSingle: false,
                container: element.parentElement,
            },
            info: {
                schema: schema,
            },
            jump: {
                schema: schema,
            },
            gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
            extraKeys: {
                "Cmd-Space": showHint,
                "Ctrl-Space": showHint,
                "Alt-Space": showHint,
                "Shift-Space": showHint,
                "Shift-Alt-Space": showHint,
                "Cmd-Enter": () => {
                    executeQuery(mirror.getValue());
                },
                "Ctrl-Enter": () => {
                    executeQuery(mirror.getValue());
                },
            },
        });
        setMirror(mirror);

        if (initialQueryValue && ref.current) {
            mirror.setValue(initialQueryValue);
            ref.current.value = initialQueryValue;
        }

        mirror.on("change", (e) => {
            onChangeQuery(e.getValue());
        });
    }, [ref, schema]);

    useEffect(() => {
        mirror?.setValue(query);
    }, [query]);

    useEffect(() => {
        // @ts-ignore
        document[EDITOR_QUERY_INPUT] = mirror;
    }, [mirror]);

    return <textarea ref={ref} className="w-full h-full" />;
};
