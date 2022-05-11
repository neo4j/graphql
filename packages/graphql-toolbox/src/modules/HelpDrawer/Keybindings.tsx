import { useContext } from "react";
import { Screen, ScreenContext } from "../../contexts/screen";
// @ts-ignore - SVG import
import ArrowLeft from "../../assets/arrow-left.svg";

interface Props {
    onClickClose: () => void;
    onClickBack: () => void;
}

const schemaScreenCmds = [
    {
        label: "Show autocomplete hints",
        winCmd: "Ctrl+Space",
        macCmd: "Cmd+Space",
    },
    {
        label: "",
        winCmd: "Alt+Space",
        macCmd: "Shift+Space",
    },
    {
        label: "",
        winCmd: "Shift+Alt+Space",
        macCmd: "-",
    },
    {
        label: "Format/Prettify code",
        winCmd: "Ctrl+l",
        macCmd: "Ctrl+l",
    },
];

const editorScreenCmds = [
    {
        label: "Show autocomplete hints",
        winCmd: "Ctrl+Space",
        macCmd: "Cmd+Space",
    },
    {
        label: "",
        winCmd: "Alt+Space",
        macCmd: "Shift+Space",
    },
    {
        label: "Execute current query",
        winCmd: "Ctrl+Enter",
        macCmd: "Cmd+Enter",
    },
    {
        label: "Format/Prettify code",
        winCmd: "Ctrl+l",
        macCmd: "Ctrl+l",
    },
];

const RowEntry = ({ label, winCmd, macCmd, isBgDark }) => {
    return (
        <div className={`flex text-xs py-4 px-2 ${isBgDark ? "n-bg-neutral-20 rounded-xl" : ""}`}>
            <span className="flex-1 italic font-light">{label}</span>
            <span className="flex-1">{winCmd}</span>
            <span className="flex-1">{macCmd}</span>
        </div>
    );
};

export const Keybindings = ({ onClickClose, onClickBack }: Props): JSX.Element => {
    const screen = useContext(ScreenContext);
    const cmds = screen.view === Screen.EDITOR ? editorScreenCmds : schemaScreenCmds;

    return (
        <div data-test-help-drawer-keybindings-list>
            <div className="flex items-center justify-between">
                <img
                    src={ArrowLeft}
                    alt="arrow left"
                    className="inline w-5 h-5 text-lg cursor-pointer"
                    data-test-help-drawer-keybindings-back
                    onClick={onClickBack}
                />
                <span className="h5">Keybindings</span>
                <span className="text-lg cursor-pointer" data-test-help-drawer-keybindings-close onClick={onClickClose}>
                    {"\u2715"}
                </span>
            </div>
            <div className="flex flex-col pt-8">
                <div className="flex font-bold py-4 px-2">
                    <div className="flex-1">Editor action</div>
                    <div className="flex-1">Win/Linux</div>
                    <div className="flex-1">Mac</div>
                </div>
                {cmds.map((cmd, idx) => {
                    return (
                        <RowEntry
                            key={`${cmd.winCmd}-${idx}`}
                            label={cmd.label}
                            winCmd={cmd.winCmd}
                            macCmd={cmd.macCmd}
                            isBgDark={idx % 2 === 1}
                        />
                    );
                })}
            </div>
        </div>
    );
};
