import React from "react";
import { Card, Row, Container } from "react-bootstrap";
import * as markdown from "./Markdown";

const content = `
# neo-push

Example blog site built with \`@neo4j/graphql\` & React.js. This application showcases features of \`@neo4j/graphql\` such as;

1. Nested Mutations
2. @auth directive
3. OGM(Object Graph Mapper)
`;

function Home() {
    return (
        <Container>
            <div className="p-3">
                <Row>
                    <Card className="m-0 p-3">
                        <markdown.Render markdown={content} />
                    </Card>
                </Row>
            </div>
        </Container>
    );
}

export default Home;
