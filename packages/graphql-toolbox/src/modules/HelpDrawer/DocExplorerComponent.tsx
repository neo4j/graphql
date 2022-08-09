import { GraphQLSchema } from "graphql";
// @ts-ignore - SVG import
import ArrowLeft from "../../assets/arrow-left.svg";
import { DocExplorer } from "../EditorView/docexplorer";

interface Props {
    onClickClose: () => void;
    onClickBack?: () => void;
    displayBackButton?: boolean;
    schema?: GraphQLSchema;
}

export const DocExplorerComponent = ({
    schema,
    displayBackButton = true,
    onClickClose,
    onClickBack,
}: Props): JSX.Element => {
    return (
        <DocExplorer
            schema={schema}
            closeButton={
                <button
                    data-test-doc-explorer-close-button
                    className="docExplorerCloseIcon"
                    onClick={onClickClose}
                    aria-label="Close Documentation Explorer"
                >
                    {"\u2715"}
                </button>
            }
            titleBarBackButton={
                displayBackButton ? (
                    <button
                        data-test-doc-explorer-back-button
                        className="docExplorerCloseIcon"
                        onClick={() => onClickBack && onClickBack()}
                        aria-label="Back to Help drawer"
                    >
                        <img src={ArrowLeft} alt="arrow left" className="inline w-5 h-5" />
                    </button>
                ) : null
            }
        />
    );
};
