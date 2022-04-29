import { useState, useEffect } from "react";
import { ResizableBox } from "react-resizable";
// @ts-ignore - SVG Import
import unionHorizontal from "./union_horizontal.svg";
// @ts-ignore - SVG Import
import unionVertical from "./union_vertical.svg";
import "./grid.css";

const initialState = {
    maxWidth: 700,
    maxHeight: 700,
    leftTop: {
        width: 200,
        height: 400,
    },
    leftBottom: {
        width: 200,
        height: 300,
    },
    right: {
        width: 200,
        height: 200,
    },
};

interface Props {
    queryEditor: React.ReactNode | null;
    resultView: React.ReactNode;
    parameterEditor: React.ReactNode;
    isRightPanelVisible: boolean;
}

export const Grid = ({ queryEditor, parameterEditor, resultView, isRightPanelVisible }: Props) => {
    const [values, setValues] = useState(initialState);

    const handleResize = () => {
        // @ts-ignore
        const { clientHeight, clientWidth } = window.document.getElementById("theGridId");
        setValues({
            maxWidth: clientWidth * 0.6,
            maxHeight: clientHeight * 0.8,
            leftTop: {
                width: clientWidth * 0.4,
                height: clientHeight * 0.5,
            },
            leftBottom: {
                width: clientWidth * 0.4,
                height: clientHeight * 0.2,
            },
            right: {
                width: clientWidth * 0.4,
                height: clientHeight,
            },
        });
    };

    useEffect(() => {
        handleResize();
    }, [isRightPanelVisible]);

    window.addEventListener("resize", handleResize);

    return (
        <div className="the-grid" id="theGridId" style={{ width: isRightPanelVisible ? "100%" : "unset" }}>
            <section className="left-top">
                <ResizableBox
                    className="left-top-inner"
                    width={values.leftTop.width}
                    height={values.leftTop.height}
                    axis="y"
                    resizeHandles={["s"]}
                    maxConstraints={[Infinity, values.maxHeight]}
                    handle={
                        <div
                            className="react-resizable-handle react-resizable-handle-s"
                            style={{ backgroundImage: `url(${unionHorizontal})` }}
                        />
                    }
                >
                    {queryEditor}
                </ResizableBox>
            </section>
            <section className="left-bottom">
                <ResizableBox
                    className="left-bottom-inner"
                    width={values.leftBottom.width}
                    height={values.leftBottom.height}
                    axis="none"
                    maxConstraints={[Infinity, values.maxHeight]}
                >
                    {parameterEditor}
                </ResizableBox>
            </section>
            <section className="right">
                <ResizableBox
                    className="right-inner"
                    width={values.right.width}
                    height={values.right.height}
                    axis="x"
                    resizeHandles={["w"]}
                    maxConstraints={[values.maxWidth, Infinity]}
                    handle={
                        <div
                            className="react-resizable-handle react-resizable-handle-w"
                            style={{ backgroundImage: `url(${unionVertical})` }}
                        />
                    }
                >
                    {resultView}
                </ResizableBox>
            </section>
        </div>
    );
};
