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
    tooltipText: string;
}

export const ProTooltip = ({ children, tooltipText }: Props) => {
    const [visible, setVisible] = useState(false);

    return (
        <div className="relative" onMouseOver={() => setVisible(true)} onMouseOut={() => setVisible(false)}>
            {children}
            {visible ? (
                <Tooltip
                    arrowPosition="top"
                    style={{
                        position: "absolute",
                        width: "150px",
                        zIndex: "30",
                        left: "-60px",
                        top: "35px",
                    }}
                >
                    {tooltipText}
                </Tooltip>
            ) : null}
        </div>
    );
};
