import { useDragResize } from "@graphiql/react";
import "./grid.css";
// @ts-ignore - SVG Import
import unionHorizontal from "./union_horizontal.svg";
// @ts-ignore - SVG Import
import unionVertical from "./union_vertical.svg";

export interface Props {
    queryEditor: React.ReactNode | null;
    resultView: React.ReactNode;
    parameterEditor: React.ReactNode;
}

export const Grid = ({ queryEditor, resultView, parameterEditor }: Props) => {
    const editorResize = useDragResize({
        direction: "horizontal",
        storageKey: "editorFlex",
    });
    const editorToolsResize = useDragResize({
        direction: "vertical",
        sizeThresholdSecond: 60,
        storageKey: "secondaryEditorFlex",
        defaultSizeRelation: 3,
    });

    return (
        <div className="flex w-full h-full">
            {/* The editors grid */}
            <div className="flex flex-1 grid-class">
                <div ref={editorResize.firstRef}>
                    <div className="flex flex-1 flex-col">
                        <div ref={editorToolsResize.firstRef}>
                            <div className="w-full h-full">{queryEditor}</div>
                        </div>
                        <div ref={editorToolsResize.dragBarRef}>
                            <div
                                className="graphiql-vertical-drag-bar"
                                style={{ backgroundImage: `url(${unionHorizontal})` }}
                            />
                        </div>
                        <div ref={editorToolsResize.secondRef}>
                            <div className="w-full h-full">{parameterEditor}</div>
                        </div>
                    </div>
                </div>
                <div ref={editorResize.dragBarRef}>
                    <div
                        className="graphiql-horizontal-drag-bar"
                        style={{ backgroundImage: `url(${unionVertical})` }}
                    />
                </div>
                <div ref={editorResize.secondRef}>
                    <div className="w-full h-full">{resultView}</div>
                </div>
            </div>
        </div>
    );
};
