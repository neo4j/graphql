import type { GraphQLSchema } from "graphql";
import { DocExplorer, SchemaContextProvider, ExplorerContextProvider } from "@graphiql/react";
import { createGraphiQLFetcher } from "@graphiql/toolkit";
// @ts-ignore - SVG import
import ArrowLeft from "../../assets/arrow-left.svg";

interface Props {
    onClickClose: () => void;
    onClickBack?: () => void;
    isEmbedded?: boolean;
    schema?: GraphQLSchema;
}

export const DocExplorerComponent = ({ schema, isEmbedded = true, onClickClose, onClickBack }: Props): JSX.Element => {
    const dummyFetcher = createGraphiQLFetcher({
        url: "empty",
    });
    return (
        <div className={`${isEmbedded ? "doc-explorer-embedded" : "doc-explorer-regular"}`}>
            {isEmbedded ? (
                <div className="flex items-center justify-between mb-4">
                    <button data-test-doc-explorer-back-button aria-label="Back to Help drawer" onClick={onClickBack}>
                        <img src={ArrowLeft} alt="arrow left" className="inline w-5 h-5 text-lg cursor-pointer" />
                    </button>
                    <button
                        data-test-doc-explorer-close-button
                        aria-label="Close Help drawer"
                        className="text-lg"
                        onClick={onClickClose}
                    >
                        {"\u2715"}
                    </button>
                </div>
            ) : null}
            {/* TODO: Move SchemaContextProvider closer to root (Main.tsx) in the future! */}
            <SchemaContextProvider schema={schema} fetcher={dummyFetcher}>
                <ExplorerContextProvider>
                    <div className="graphiql-container">
                        <DocExplorer />
                    </div>
                </ExplorerContextProvider>
            </SchemaContextProvider>
        </div>
    );
};
