import { Fragment } from "react";
// @ts-ignore - SVG import
import ArrowLeft from "../../assets/arrow-left.svg";

interface Props {
    onClickClose: () => void;
    onClickBack: () => void;
}

export const Keybindings = ({ onClickClose, onClickBack }: Props): JSX.Element => {
    return (
        <div data-test-help-drawer-keybindings-list>
            <div>
                <button
                    className="docExplorerCloseIcon"
                    onClick={onClickBack}
                    aria-label="Back to Help drawer"
                    data-test-help-drawer-doc-explorer-back-button
                >
                    <img src={ArrowLeft} alt="arrow left" className="inline w-5 h-5" />
                </button>
                <span className="h5">Keybindings</span>
                <span className="text-lg cursor-pointer" data-test-help-drawer-close onClick={onClickClose}>
                    {"\u2715"}
                </span>
            </div>
            <div>
                <span>Test</span>
            </div>
        </div>
    );
};
