import { useContext } from "react";
import { Screen, ScreenContext } from "../../contexts/screen";
// @ts-ignore - SVG import
import ArrowLeft from "../../assets/arrow-left.svg";

interface RowEntryType {
    label: string;
    winCmd: string;
    macCmd: string;
    isBgDark?: boolean;
}

interface Props {
    onClickClose: () => void;
    onClickBack: () => void;
}

const schemaScreenCmds: RowEntryType[] = [
    {
        label: "Show autocomplete hints",
        winCmd: "Ctrl+Space",
        macCmd: "Option+Space",
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

const editorScreenCmds: RowEntryType[] = [
    {
        label: "Show\n autocomplete\n hints",
        winCmd: "Ctrl+Space",
        macCmd: "Option+Space",
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

const RowEntry = ({ label, winCmd, macCmd, isBgDark }: RowEntryType) => {
    return (
        <div className={`flex text-xs py-4 px-2 ${isBgDark ? "n-bg-neutral-20 rounded-xl" : ""}`}>
            <div className="flex-1 italic font-light">
                <span className="whitespace-break-spaces pr-6">{label}</span>
            </div>
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
                {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
                <img
                    src={ArrowLeft}
                    alt="arrow left"
                    className="inline w-5 h-5 text-lg cursor-pointer"
                    data-test-help-drawer-keybindings-back
                    onClick={onClickBack}
                    onKeyDown={onClickBack}
                />
                <span className="h5">Keybindings</span>
                <span
                    className="text-lg cursor-pointer"
                    data-test-help-drawer-keybindings-close
                    onClick={onClickClose}
                    onKeyDown={onClickClose}
                    role="button"
                    tabIndex={0}
                >
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
