import { useState, useEffect } from "react";
import { ResizableBox } from "react-resizable";
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
    queryEditor: any | null;
    resultView: any;
    parameterEditor: any;
}

export const Grid = ({ queryEditor, parameterEditor, resultView }: Props) => {
    const [values, setValues] = useState(initialState);

    const handleResize = () => {
        // @ts-ignore
        const { clientHeight, clientWidth } = window.document.getElementById("frameGridId");
        setValues({
            maxWidth: clientWidth * 0.6,
            maxHeight: clientHeight * 0.7,
            leftTop: {
                width: clientWidth * 0.4,
                height: clientHeight * 0.5,
            },
            leftBottom: {
                width: clientWidth * 0.4,
                height: clientHeight * 0.3,
            },
            right: {
                width: clientWidth * 0.4,
                height: clientHeight,
            },
        });
    };

    useEffect(() => {
        handleResize();
    }, []);

    return (
        <div className="the-grid" id="frameGridId" style={{ height: "70vh", width: "70vw" }}>
            <section className="left-top">
                <ResizableBox
                    className="left-top-inner"
                    width={values.leftTop.width}
                    height={values.leftTop.height}
                    axis="y"
                    resizeHandles={["s"]}
                    maxConstraints={[Infinity, values.maxHeight]}
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
                >
                    {resultView}
                </ResizableBox>
            </section>
        </div>
    );
};
