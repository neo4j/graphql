import { useEffect, useRef, useState } from "react";
import { CodeMirror } from "../../util";

export interface Props {
    json?: string;
    readonly?: boolean;
    onChange?: (json: string) => void;
}

export const JSONEditor = (props: Props) => {
    const ref = useRef<HTMLTextAreaElement | null>(null);
    const mirror = useRef<CodeMirror.Editor | null>(null);
    const [input, setInput] = useState("");

    useEffect(() => {
        if (!ref.current) {
            return;
        }

        mirror.current = CodeMirror.fromTextArea(ref.current, {
            mode: { name: "javascript", json: true },
            theme: "dracula",
            readOnly: props.readonly,
            lineNumbers: true,
            lineWrapping: true,
            tabSize: 2,
            keyMap: "sublime",
            autoCloseBrackets: true,
            matchBrackets: true,
            showCursorWhenSelecting: true,
            foldGutter: {
                // @ts-ignore
                minFoldSize: 4,
            },
            gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
        });

        mirror.current.on("change", (e) => {
            setInput(e.getValue());
        });
    }, []);

    useEffect(() => {
        if (props.json && mirror.current) {
            mirror.current.setValue(JSON.stringify(JSON.parse(props.json || "{}"), null, 2));
        }
    }, [props.json]);

    useEffect(() => {
        if (!props.readonly && props.onChange) {
            props.onChange(input);
        }
    }, [input, props.onChange]);

    useEffect(() => {
        return () => {
            mirror.current = null;
        };
    }, []);

    return <textarea style={{ width: "100%", height: "100%" }} ref={ref} />;
};
