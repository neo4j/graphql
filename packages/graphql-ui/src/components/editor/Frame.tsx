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

import { Col, ColsWrapper, Row, RowsWrapper } from "react-grid-resizable";

export interface Props {
    queryEditor: any | null;
    resultView: any;
    parameterEditor: any;
    explorer?: any;
    showExplorer: boolean;
    showDocs: boolean;
    documentation?: any;
}

export const Frame = (props: Props) => {
    return (
        <div className="h-full flex flex-row">
            {props.showExplorer ? <div className="w-80 bg-white">{props.explorer}</div> : null}
            <Row className={"flex-1"} initialHeight={1200}>
                <ColsWrapper>
                    <Col initialWidth={600} left={false}>
                        <RowsWrapper>
                            <Row initialHeight={900}>{props.queryEditor}</Row>
                            <Row initialHeight={300}>{props.parameterEditor}</Row>
                        </RowsWrapper>
                    </Col>
                    <Col initialWidth={600}>
                        <RowsWrapper>
                            <Row initialHeight={1200}>
                                <div style={{ position: "relative", width: "100%", height: "100%" }}>
                                    <div style={{ position: "absolute", width: "100%", height: "100%" }}>
                                        {props.resultView}
                                    </div>
                                    {props.showDocs ? (
                                        <div
                                            style={{
                                                position: "absolute",
                                                top: 0,
                                                bottom: 0,
                                                right: 0,
                                                width: "400px",
                                                backgroundColor: "white",
                                            }}
                                        >
                                            {props.documentation}
                                        </div>
                                    ) : null}
                                </div>
                            </Row>
                        </RowsWrapper>
                    </Col>
                </ColsWrapper>
            </Row>
        </div>
    );
};
