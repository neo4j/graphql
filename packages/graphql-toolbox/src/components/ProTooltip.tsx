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

import { useState } from "react";
import { Tooltip } from "@neo4j-ndl/react";

interface Props {
    children?: any;
    tooltipText: string | React.ReactNode;
    width?: number;
    left?: number;
    top?: number;
    arrowPositionOverride?: "bottom" | "left" | "right" | "top" | "top-left" | "top-right";
    blockVisibility?: boolean;
}

export const ProTooltip = ({
    children,
    tooltipText,
    width,
    top,
    left,
    arrowPositionOverride = "top",
    blockVisibility = false,
}: Props) => {
    const [visible, setVisible] = useState<boolean>(false);

    const onMouseAction = (nextVisibilityState: boolean) => {
        if (blockVisibility) {
            setVisible(false);
            return;
        }
        setVisible(nextVisibilityState);
    };

    return (
        <div
            className="relative"
            onFocus={() => onMouseAction(true)}
            onMouseOver={() => onMouseAction(true)}
            onBlur={() => onMouseAction(false)}
            onMouseOut={() => onMouseAction(false)}
        >
            {children}
            {visible ? (
                <Tooltip
                    arrowPosition={arrowPositionOverride || "top"}
                    style={{
                        position: "absolute",
                        width: `${width || 140}px`,
                        zIndex: 300,
                        left: `${left || -55}px`,
                        top: `${top || 35}px`,
                    }}
                >
                    {tooltipText}
                </Tooltip>
            ) : null}
        </div>
    );
};
