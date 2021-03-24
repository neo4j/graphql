import React, { useState, useContext, useEffect, useCallback } from "react";
import { Alert, Spinner, Container, Card, Row, Col, Button, Modal, Form } from "react-bootstrap";
import { auth, graphql } from "../contexts";
import constants from "../constants";
import { Link, useHistory } from "react-router-dom";
import { USER, CREATE_BLOG, MY_BLOGS, RECENTLY_UPDATED_BLOGS } from "../queries";
import { BlogInterface } from "./Blog";

function CreateBlog({ close }: { close: () => void }) {
    const history = useHistory();
    const { mutate } = useContext(graphql.Context);
    const { getId } = useContext(auth.Context);
    const [name, setName] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (name) {
            setError("");
        }
    }, [name, setError]);

    const submit = useCallback(
        async (event: React.FormEvent) => {
            event.preventDefault();
            setLoading(true);

            try {
                const response = await mutate({
                    mutation: CREATE_BLOG,
                    variables: { name, sub: getId() },
                });

                history.push(constants.BLOG_PAGE + "/" + response.createBlogs.blogs[0].id);
            } catch (e) {
                setError(e.message);
            }

            setLoading(false);
        },
        [name, mutate, setLoading, setError, getId]
    );

    if (loading) {
        return (
            <>
                <Modal.Header>
                    <Modal.Title>Creating Blog</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="d-flex flex-column align-items-center">
                        <Spinner className="mt-5 mb-5" animation="border" />
                    </div>
                </Modal.Body>
            </>
        );
    }

    return (
        <>
            <Modal.Header closeButton>
                <Modal.Title>Create Blog</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form onSubmit={submit}>
                    <Form.Group controlId="name">
                        <Form.Label>Name</Form.Label>
                        <Form.Control
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            maxLength={60}
                        />
                    </Form.Group>
                    {error && (
                        <Alert variant="danger text-center" className="mt-3">
                            {error}
                        </Alert>
                    )}
                    <div className="d-flex justify-content-end">
                        <Button variant="warning" onClick={close}>
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit" className="ml-2">
                            Submit
                        </Button>
                    </div>
                </Form>
            </Modal.Body>
        </>
    );
}

function BlogItem(props: { blog: any; updated?: boolean }) {
    return (
        <Col md={{ span: 4 }} className="p-0">
            <Card className="m-3">
                <Card.Title className="m-2">{props.blog.name}</Card.Title>
                <Card.Subtitle className="m-2">
                    <Link to={constants.BLOG_PAGE + `/${props.blog.id}`}>Read</Link>
                </Card.Subtitle>
                <Card.Footer className="text-muted">
                    <p className="m-0 p-0">- {props.blog.creator.email}</p>
                    <p className="m-0 p-0 font-italic">
                        {props.updated ? `- ${props.blog.updatedAt}` : `- ${props.blog.createdAt}`}
                    </p>
                </Card.Footer>
            </Card>
        </Col>
    );
}

function MyBlogs() {
    const { getId } = useContext(auth.Context);
    const { query } = useContext(graphql.Context);
    const [skip, setSkip] = useState(0);
    const [limit] = useState(10);
    const [myBlogsHasMore, setMyBlogsHasMore] = useState(false);
    const [blogs, setBlogs] = useState<BlogInterface[]>([]);
    const [loading, setLoading] = useState(true);

    const getBlogs = useCallback(async () => {
        setLoading(true);

        try {
            const response = await query({
                query: MY_BLOGS,
                variables: {
                    id: getId(),
                    skip: blogs.length,
                    limit,
                    hasNextBlogsSkip: blogs.length === 0 ? limit : blogs.length + 1,
                },
            });

            setMyBlogsHasMore(Boolean(response.hasNextBlogs.length));
            setBlogs((b) => [...b, ...response.myBlogs]);
        } catch (e) {}

        setLoading(false);
    }, [skip, blogs, limit]);

    useEffect(() => {
        getBlogs();
    }, [skip]);

    if (loading) {
        <Card className="mt-3 p-3">
            <h2>My Blogs</h2>
            <div className="d-flex flex-column align-items-center">
                <Spinner className="mt-5" animation="border" />
            </div>
        </Card>;
    }

    return (
        <Card className="mt-3 p-3">
            <h2>My Blogs</h2>
            <Row>
                {blogs.map((blog) => (
                    <BlogItem key={blog.id} blog={blog}></BlogItem>
                ))}
            </Row>
            {myBlogsHasMore && (
                <div className="d-flex justify-content-center w-100" onClick={() => setSkip((s) => s + 1)}>
                    <Button>Load More</Button>
                </div>
            )}
        </Card>
    );
}

function RecentlyUpdatedBlogs() {
    const { query } = useContext(graphql.Context);
    const [limit] = useState(10);
    const [skip, setSkip] = useState(0);
    const [myBlogsHasMore, setMyBlogsHasMore] = useState(false);
    const [blogs, setBlogs] = useState<BlogInterface[]>([]);
    const [loading, setLoading] = useState(true);

    const getBlogs = useCallback(async () => {
        setLoading(true);
        try {
            const response = await query({
                query: RECENTLY_UPDATED_BLOGS,
                variables: {
                    skip: blogs.length,
                    limit,
                    hasNextBlogsSkip: blogs.length === 0 ? limit : blogs.length + 1,
                },
            });

            setMyBlogsHasMore(Boolean(response.hasNextBlogs.length));
            setBlogs((b) => [...b, ...response.recentlyUpdatedBlogs]);
        } catch (e) {}

        setLoading(false);
    }, [skip, blogs]);

    useEffect(() => {
        getBlogs();
    }, [skip]);

    if (loading) {
        <Card className="mt-3 p-3">
            <h2>Recently Updated</h2>
            <div className="d-flex flex-column align-items-center">
                <Spinner className="mt-5" animation="border" />
            </div>
        </Card>;
    }

    return (
        <Card className="mt-3 p-3 mb-3">
            <h2>Recently Updated</h2>
            <Row>
                {blogs.map((blog) => (
                    <BlogItem key={blog.id} blog={blog} updated={true}></BlogItem>
                ))}
            </Row>
            {myBlogsHasMore && (
                <div className="d-flex justify-content-center w-100" onClick={() => setSkip((s) => s + 1)}>
                    <Button>Load More</Button>
                </div>
            )}
        </Card>
    );
}

function Dashboard() {
    const { getId } = useContext(auth.Context);
    const { query } = useContext(graphql.Context);
    const [error, setError] = useState();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<{ email: string }>();
    const [creatingBlog, setCreatingBlog] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const response = await query({
                    query: USER,
                    variables: { id: getId() },
                });

                setUser(response.users[0]);
            } catch (e) {
                setError(e.message);
            }

            setLoading(false);
        })();
    }, [getId]);

    if (error) {
        return <Alert>{error}</Alert>;
    }

    if (loading || !user) {
        return (
            <div className="d-flex flex-column align-items-center">
                <Spinner className="mt-5" animation="border" />
            </div>
        );
    }

    return (
        <>
            <Modal
                aria-labelledby="contained-modal-title-vcenter"
                centered
                size="lg"
                show={creatingBlog}
                onHide={() => setCreatingBlog((x) => !x)}
            >
                <CreateBlog close={() => setCreatingBlog(false)}></CreateBlog>
            </Modal>
            <Container>
                <Card className="mt-3 p-3">
                    <h1>Hey, {user.email}</h1>
                    <p className="text-muted">Browse the blogs below or create one and write some posts!</p>
                    <hr />
                    <div className="d-flex justify-content-start">
                        <Button onClick={() => setCreatingBlog((x) => !x)} variant="outline-primary">
                            Create Blog
                        </Button>
                    </div>
                </Card>
                <MyBlogs />
                <RecentlyUpdatedBlogs />
            </Container>
        </>
    );
}

export default Dashboard;
