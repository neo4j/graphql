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
