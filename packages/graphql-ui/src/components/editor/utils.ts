import { EditorFromTextArea } from "codemirror";
import prettier from "prettier";
import prettierBabel from "prettier/parser-babel";
import parserGraphQL from "prettier/parser-graphql";

export enum ParserOptions {
    GRAPH_QL,
    JSON,
}

export const formatCode = (mirror: EditorFromTextArea, parserOption: ParserOptions): void => {
    const cursor = mirror.getCursor();
    const value = mirror.getValue();

    let options = {};
    switch (parserOption) {
        case ParserOptions.GRAPH_QL:
            options = {
                parser: "graphql",
                plugins: [parserGraphQL],
            };
            break;
        case ParserOptions.JSON:
            options = {
                parser: "json",
                plugins: [prettierBabel],
            };
            break;
        default:
            options = {
                parser: "graphql",
                plugins: [parserGraphQL],
            };
            break;
    }

    const formatted = prettier.format(value, options);
    mirror.setValue(formatted);
    if (cursor) mirror.setCursor(cursor);
};
