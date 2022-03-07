import { GraphQLSchema } from "graphql";
import { useEffect, useRef } from "react";
import { CodeMirror } from "../../util";

export interface Props {
    schema: GraphQLSchema;
    initialQueryValue?: string;
    query: (override?: string) => Promise<void>;
    setQuery: React.Dispatch<React.SetStateAction<string>>;
    onChangeQuery: (query: string) => void;
}

export const GraphQLQueryEditor = ({ schema, initialQueryValue, setQuery, query, onChangeQuery }: Props) => {
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
                    query(mirror.getValue());
                },
                "Ctrl-Enter": () => {
                    query(mirror.getValue());
                },
            },
        });

        if (initialQueryValue && ref.current) {
            mirror.setValue(initialQueryValue);
            ref.current.value = initialQueryValue;
        }

        mirror.on("change", (e) => {
            setQuery(e.getValue());
            onChangeQuery(e.getValue());
        });
    }, [ref, schema]);

    return <textarea ref={ref} className="w-full h-full" />;
};
