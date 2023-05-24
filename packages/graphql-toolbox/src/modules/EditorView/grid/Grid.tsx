/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 *
 * This file is part of Neo4j.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { useState, useEffect, useMemo } from "react";
import { ResizableBox } from "react-resizable";
import debounce from "lodash.debounce";
import { useStore } from "../../../store";
import type { GridState } from "../../../types";
import { usePrevious } from "../../..//utils/utils";
// @ts-ignore - SVG Import
import unionHorizontal from "./union_horizontal.svg";
// @ts-ignore - SVG Import
import unionVertical from "./union_vertical.svg";
import "./grid.css";

const DEBOUNCE_LOCAL_STORE_TIMEOUT = 300;
const DEBOUNCE_WINDOW_RESIZE_TIMEOUT = 200;

interface Props {
    queryEditor: React.ReactNode | null;
    resultView: React.ReactNode;
    parameterEditor: React.ReactNode;
    isRightPanelVisible: boolean;
}

const initialState: GridState = {
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

export const Grid = ({ queryEditor, parameterEditor, resultView, isRightPanelVisible }: Props) => {
    const [values, setValues] = useState<GridState>(useStore.getState().gridState || initialState);
    const prevIsRightPanelVisible = usePrevious(isRightPanelVisible);

    const debouncedBoxResize = useMemo(
        () =>
            debounce((nextState: GridState) => {
                useStore.setState({ gridState: nextState });
            }, DEBOUNCE_LOCAL_STORE_TIMEOUT),
        []
    );

    const debouncedWindowResize = useMemo(
        () =>
            debounce(() => {
                handleResize();
            }, DEBOUNCE_WINDOW_RESIZE_TIMEOUT),
        []
    );

    const onResizeBox = (boxName: string, size: { width: number; height: number }) => {
        const nextState: GridState = {
            ...values,
            [boxName]: { ...size },
        };
        setValues(nextState);
        debouncedBoxResize(nextState);
    };

    const handleResize = () => {
        const gridElement = window.document.getElementById("theGridId");
        if (!gridElement) return;

        const { clientHeight, clientWidth } = gridElement;
        const nextState: GridState = {
            ...values,
            maxWidth: clientWidth * 0.6,
            maxHeight: clientHeight * 0.8,
            right: {
                width: clientWidth * 0.5,
                height: values.right.height,
            },
        };
        setValues(nextState);
        useStore.setState({ gridState: nextState });
    };

    useEffect(() => {
        if (prevIsRightPanelVisible === undefined) return;
        handleResize();
    }, [isRightPanelVisible]);

    window.addEventListener("resize", debouncedWindowResize);

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
                    onResize={(_, { size }) => onResizeBox("leftTop", size)}
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
                    onResize={(_, { size }) => onResizeBox("right", size)}
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
