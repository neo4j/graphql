import type { GraphQLSchema } from "graphql";
import {
    DocExplorer,
    useExplorerContext,
    SchemaContextProvider,
    ExplorerContextProvider,
    EditorContextProvider,
    useEditorContext,
    useSchemaContext,
} from "@graphiql/react";
import { createGraphiQLFetcher } from "@graphiql/toolkit";
// @ts-ignore - SVG import
import ArrowLeft from "../../assets/arrow-left.svg";
// import { DocExplorer } from "../EditorView/docexplorer";

interface Props {
    onClickClose: () => void;
    onClickBack?: () => void;
    isEmbedded?: boolean;
    schema?: GraphQLSchema;
}

export const DocExplorerComponent = ({ schema, isEmbedded = true, onClickClose, onClickBack }: Props): JSX.Element => {
    const fetcher = createGraphiQLFetcher({
        url: "empty",
    });
    // useExplorerContext();
    // useEditorContext();
    // useSchemaContext();
    return (
        <div className={`${isEmbedded ? "doc-explorer-embedded" : "doc-explorer-regular"}`}>
            <SchemaContextProvider schema={schema} fetcher={fetcher}>
                <ExplorerContextProvider>
                    <div className="graphiql-container">
                        <DocExplorer />
                    </div>
                </ExplorerContextProvider>
            </SchemaContextProvider>
        </div>
    );
};
