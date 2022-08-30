import { useState, useEffect, useMemo } from "react";
import { ResizableBox } from "react-resizable";
import debounce from "lodash.debounce";
import { Storage } from "../../../utils/storage";
import { LOCAL_STATE_GRID_STATE } from "../../../constants";
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
    const [values, setValues] = useState(Storage.retrieveJSON(LOCAL_STATE_GRID_STATE) || initialState);

    const debouncedEventHandler = useMemo(
        () =>
            debounce((nextState) => {
                Storage.storeJSON(LOCAL_STATE_GRID_STATE, nextState);
            }, 300),
        []
    );

    // const debouncedWindowResize = useMemo(
    //     () =>
    //         debounce(() => {
    //             console.log("RESIZE");
    //         }, 200),
    //     []
    // );

    const onResize = (element: string, size: { width: number; height: number }) => {
        // console.log(event, { element, size, handle });
        const nextState = {
            ...values,
            [element]: { ...size },
        };
        setValues(nextState);
        debouncedEventHandler(nextState);
    };

    const handleResize = () => {
        const gridElement = window.document.getElementById("theGridId");
        if (!gridElement) return;

        const { clientHeight, clientWidth } = gridElement;
        // const nextState = {
        //     maxWidth: clientWidth * 0.6,
        //     maxHeight: clientHeight * 0.8,
        //     leftTop: {
        //         width: clientWidth * 0.4,
        //         height: clientHeight * 0.5,
        //     },
        //     leftBottom: {
        //         width: clientWidth * 0.4,
        //         height: clientHeight * 0.2,
        //     },
        //     right: {
        //         width: clientWidth * 0.4,
        //         height: clientHeight,
        //     },
        // };
        const nextState = {
            ...values,
            maxWidth: clientWidth * 0.6,
            maxHeight: clientHeight * 0.8,
            // right: {
            //     width: clientWidth * 0.5,
            //     height: values.right.height,
            // },
        };
        setValues(nextState);
        Storage.storeJSON(LOCAL_STATE_GRID_STATE, nextState);
    };

    useEffect(() => {
        handleResize();
    }, [isRightPanelVisible]);

    // // window.addEventListener("resize", handleResize);
    // window.addEventListener("resize", () => {
    //     debouncedWindowResize();
    // });

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
                    onResize={(_, { size }) => onResize("leftTop", size)}
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
                    onResize={(_, { size }) => onResize("right", size)}
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
