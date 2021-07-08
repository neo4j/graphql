import { useQuery } from "@apollo/client";
import React, { useState, useContext, useEffect, useCallback, useRef } from "react";
import {
    Container,
    Card,
    Row,
    Col,
    Button,
    Spinner,
    Modal,
    Form,
    Alert,
    InputGroup,
    FormControl,
} from "react-bootstrap";
import { useParams, useHistory, Link } from "react-router-dom";
import constants from "../constants";
import { graphql, auth } from "../contexts";
import {
    BLOG,
    CREATE_POST,
    BLOG_POSTS,
    EDIT_BLOG,
    DELETE_BLOG,
    ASSIGN_BLOG_AUTHOR,
    REVOKE_BLOG_AUTHOR,
} from "../queries";
import * as markdown from "./Markdown";
import { PostInterface } from "./Post";

type Author = {
    id: string;
    email: string;
};

export interface BlogInterface {
    id?: string;
    name?: string;
    creator?: { id: string; email: string };
    isCreator?: boolean;
    isAuthor?: boolean;
    createdAt?: string;
    authors?: Author[];
}

function CreatePost({ close, blog }: { close: () => void; blog: BlogInterface }) {
    const history = useHistory();
    const { mutate } = useContext(graphql.Context);
    const { getId } = useContext(auth.Context);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (title && content) {
            setError("");
        }
    }, [title, content, setError]);

    const submit = useCallback(
        async (event: React.FormEvent) => {
            event.preventDefault();
            setLoading(true);

            try {
                const response = await mutate({
                    mutation: CREATE_POST,
                    variables: { title, content, user: getId(), blog: blog.id },
                });

                history.push(`${constants.POST_PAGE}/${response.createPosts.posts[0].id}`);
            } catch (e) {
                setError(e.message);
            }

            setLoading(false);
        },
        [title, content, blog, mutate, setLoading, setError, getId]
    );

    if (loading) {
        return (
            <>
                <Modal.Header>
                    <Modal.Title>Creating Post</Modal.Title>
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
                <Modal.Title>Create Post</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form onSubmit={submit}>
                    <Form.Group controlId="title">
                        <Form.Label>Title</Form.Label>
                        <Form.Control
                            type="text"
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            maxLength={60}
                        />
                    </Form.Group>

                    <Form.Label>Content</Form.Label>
                    <div className="mb-3">
                        <markdown.Editor markdown={content} onChange={(mk: string) => setContent(mk)} />
                    </div>

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

function PostItem(props: { post: any }) {
    return (
        <Col md={{ span: 4 }} className="p-0">
            <Card className="m-3">
                <Card.Title className="m-2">{props.post.title}</Card.Title>
                <Card.Subtitle className="m-2">
                    <Link to={`${constants.POST_PAGE}/${props.post.id}`}>Read</Link>
                </Card.Subtitle>
                <Card.Footer className="text-muted">
                    <p className="m-0 p-0">- {props.post.author.email}</p>
                    <p className="m-0 p-0 font-italic">- {props.post.createdAt}</p>
                </Card.Footer>
            </Card>
        </Col>
    );
}

function BlogPosts(props: { blog: BlogInterface }) {
    const first = 2;
    const { data, loading, fetchMore } = useQuery(BLOG_POSTS, { variables: { blog: props.blog.id, first } });
    const startCursor = useRef<string>();
    const cachedCursor = startCursor.current;

    if (loading) {
        return (
            <Card className="mt-3 p-3">
                <h2>Posts</h2>
                <div className="d-flex flex-column align-items-center">
                    <Spinner className="mt-5" animation="border" />
                </div>
            </Card>
        );
    }

    const blog = data.blogs[0];
    const pageInfo = blog.postsConnection.pageInfo;
    const posts = blog.postsConnection.edges.map((e: any) => e.node) as PostInterface[];
    startCursor.current = pageInfo.startCursor;

    if (!posts.length) {
        return <></>;
    }

    return (
        <Card className="mt-3 p-3">
            <h2>Posts</h2>
            <Row>
                {posts.map((post) => (
                    <PostItem key={post.id} post={post} />
                ))}
            </Row>
            <div className="d-flex justify-content-center">
                {pageInfo.hasPreviousPage && (
                    <Button
                        variant="secondary"
                        className="mr-3"
                        onClick={() => {
                            fetchMore({
                                variables: {
                                    after: cachedCursor,
                                },
                            });
                        }}
                    >
                        Go Back
                    </Button>
                )}
                {pageInfo.hasNextPage && (
                    <Button
                        onClick={() => {
                            fetchMore({
                                variables: {
                                    after: pageInfo.endCursor,
                                },
                            });
                        }}
                    >
                        Next Page
                    </Button>
                )}
            </div>
        </Card>
    );
}

function DeleteBlog(props: { blog: BlogInterface; close: () => void }) {
    const history = useHistory();
    const { mutate } = useContext(graphql.Context);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const deleteBlog = useCallback(async () => {
        setLoading(true);

        try {
            await mutate({
                mutation: DELETE_BLOG,
                variables: { id: props.blog.id },
            });

            history.push(constants.DASHBOARD_PAGE);
        } catch (e) {
            setError(e.message);
        }

        setLoading(false);
    }, []);

    if (loading) {
        return (
            <>
                <Modal.Header>
                    <Modal.Title>Delete Blog {props.blog.name}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="d-flex flex-column align-items-center">
                        <Spinner className="mt-5 mb-5" animation="border" />
                    </div>
                </Modal.Body>
            </>
        );
    }

    if (error) {
        <>
            <Modal.Header>
                <Modal.Title>Delete Blog {props.blog.name}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className="d-flex flex-column align-items-center">
                    <Alert variant="danger text-center" className="mt-3">
                        {error}
                    </Alert>
                </div>
            </Modal.Body>
        </>;
    }

    return (
        <>
            <Modal.Header closeButton>
                <Modal.Title>Delete Blog {props.blog.name}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Alert variant="danger">Are you sure you want to delete Blog {props.blog.name} ?</Alert>
                <div className="d-flex justify-content-end">
                    <Button variant="secondary" onClick={props.close}>
                        Cancel
                    </Button>
                    <Button variant="danger" type="submit" className="ml-2" onClick={deleteBlog}>
                        Delete
                    </Button>
                </div>
            </Modal.Body>
        </>
    );
}

function AdminModal(props: { blog: BlogInterface; setBlog: (cb: (b: BlogInterface) => BlogInterface) => void }) {
    const [authorEmail, setAuthorEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const { mutate } = useContext(graphql.Context);

    const assignAuthor = useCallback(async () => {
        setLoading(true);

        try {
            const response = await mutate({
                mutation: ASSIGN_BLOG_AUTHOR,
                variables: { blog: props.blog.id, authorEmail },
            });

            props.setBlog((b) => ({
                ...b,
                authors: response.updateBlogs.blogs[0].authors,
            }));

            setAuthorEmail("");
        } catch (e) {
            setError(e.message);
        }

        setLoading(false);
    }, [authorEmail]);

    const revokeAuthor = useCallback(async (email: string) => {
        setLoading(true);

        try {
            const response = await mutate({
                mutation: REVOKE_BLOG_AUTHOR,
                variables: { blog: props.blog.id, email },
            });

            props.setBlog((b) => ({
                ...b,
                authors: response.updateBlogs.blogs[0].authors,
            }));

            setAuthorEmail("");
        } catch (e) {
            setError(e.message);
        }

        setLoading(false);
    }, []);

    return (
        <>
            <Modal.Header closeButton>
                <Modal.Title>Blog Admin: {props.blog.name}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <h4>Authors</h4>

                {error && (
                    <div className="d-flex flex-column align-items-center">
                        <Alert variant="danger text-center" className="mt-3">
                            {error}
                        </Alert>
                    </div>
                )}

                {loading && (
                    <div className="d-flex flex-column align-items-center">
                        <Spinner className="m-5" animation="border" />
                    </div>
                )}

                {!loading && (
                    <Row>
                        {(props.blog.authors || []).map((a) => (
                            <Col md={{ span: 6 }} className="p-0">
                                <Card className="m-3">
                                    <div className="d-flex justify-content-center align-items-center p-2">
                                        <div>
                                            <p className="mb-0">{a.email}</p>
                                        </div>
                                        <div>
                                            <Button
                                                variant="outline-danger"
                                                size="sm"
                                                className="ml-3"
                                                onClick={() => revokeAuthor(a.email)}
                                            >
                                                Revoke
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                )}

                <hr />

                <h4>Assign Author</h4>
                <div className="d-flex mt-3">
                    <div className="flex-grow-1">
                        <FormControl
                            disabled={loading}
                            placeholder="Author Email"
                            value={authorEmail}
                            aria-label="Author Email"
                            onChange={(e) => setAuthorEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <Button disabled={loading} className="ml-3" onClick={assignAuthor}>
                            Submit
                        </Button>
                    </div>
                </div>
            </Modal.Body>
        </>
    );
}

function Blog() {
    const { id } = useParams<{ id: string }>();
    const history = useHistory();
    const [blog, setBlog] = useState<{
        id?: string;
        name?: string;
        creator?: { id: string; email: string };
        isCreator?: boolean;
        isAuthor?: boolean;
        createdAt?: string;
    }>({});
    const { query, mutate } = useContext(graphql.Context);
    const [loading, setLoading] = useState(true);
    const [creatingPost, setCreatingPost] = useState(false);
    const [editedName, setEditedName] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

    useEffect(() => {
        setEditedName(blog.name as string);
    }, [isEditing, blog]);

    useEffect(() => {
        (async () => {
            try {
                const response = await query({
                    query: BLOG,
                    variables: { id },
                });

                const foundBlog = response.blogs[0];
                if (!foundBlog) {
                    history.push(constants.DASHBOARD_PAGE);
                }

                setBlog(foundBlog);
            } catch (e) {
                setError(e.message);
            }

            setLoading(false);
        })();
    }, [id]);

    const editBlog = useCallback(async () => {
        setLoading(true);

        try {
            await mutate({
                mutation: EDIT_BLOG,
                variables: { id: blog.id, name: editedName },
            });

            setBlog((b) => ({ ...b, name: editedName }));
            setIsEditing(false);
        } catch (e) {
            setError(e.message);
        }

        setLoading(false);
    }, [blog, editedName]);

    if (error) {
        return (
            <div className="d-flex flex-column align-items-center">
                <Alert variant="danger text-center" className="mt-3">
                    {error}
                </Alert>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="d-flex flex-column align-items-center">
                <Spinner className="m-5" animation="border" />
            </div>
        );
    }

    return (
        <>
            <Modal
                aria-labelledby="contained-modal-title-vcenter"
                centered
                size="lg"
                show={creatingPost}
                onHide={() => setCreatingPost((x) => !x)}
            >
                <CreatePost close={() => setCreatingPost(false)} blog={blog} />
            </Modal>
            <Modal
                aria-labelledby="contained-modal-title-vcenter"
                centered
                size="lg"
                show={isDeleting}
                onHide={() => setIsDeleting((x) => !x)}
            >
                <DeleteBlog close={() => setIsDeleting(false)} blog={blog} />
            </Modal>
            <Modal
                aria-labelledby="contained-modal-title-vcenter"
                centered
                size="lg"
                show={isAdminModalOpen}
                onHide={() => setIsAdminModalOpen((x) => !x)}
            >
                <AdminModal setBlog={setBlog} blog={blog} />
            </Modal>
            <Container>
                <Card className="mt-3 p-3">
                    {isEditing ? (
                        <InputGroup className="mb-3">
                            <InputGroup.Prepend>
                                <InputGroup.Text id="name">Name</InputGroup.Text>
                            </InputGroup.Prepend>
                            <FormControl
                                size="lg"
                                onChange={(e) => setEditedName(e.target.value)}
                                value={editedName}
                                aria-label="Blog Name"
                                aria-describedby="name"
                            />
                        </InputGroup>
                    ) : (
                        <h1>{blog.name}</h1>
                    )}

                    <p className="text-muted">- {blog.creator?.email}</p>
                    <p className="text-muted">- {blog.createdAt}</p>
                    {(blog.isCreator || blog.isAuthor) && (
                        <>
                            <hr />
                            <div className="d-flex justify-content-start">
                                {!isEditing && (
                                    <Button variant="outline-primary" onClick={() => setCreatingPost((x) => !x)}>
                                        Create Post
                                    </Button>
                                )}
                                {blog.isCreator && (
                                    <>
                                        {isEditing && (
                                            <>
                                                <Button variant="warning" onClick={() => setIsEditing(false)}>
                                                    Cancel Edit
                                                </Button>
                                                <Button className="ml-2" variant="primary" onClick={editBlog}>
                                                    Submit
                                                </Button>
                                            </>
                                        )}
                                        {!isEditing && (
                                            <>
                                                <Button
                                                    className="ml-3"
                                                    variant="outline-secondary"
                                                    onClick={() => setIsEditing((x) => !x)}
                                                >
                                                    Edit
                                                </Button>
                                                <Button
                                                    className="ml-3"
                                                    variant="outline-info"
                                                    onClick={() => setIsAdminModalOpen(true)}
                                                >
                                                    Admin
                                                </Button>
                                                <Button
                                                    className="ml-3"
                                                    variant="outline-danger"
                                                    onClick={() => setIsDeleting(true)}
                                                >
                                                    Delete
                                                </Button>
                                            </>
                                        )}
                                    </>
                                )}
                            </div>
                        </>
                    )}
                </Card>
                <BlogPosts blog={blog} />
            </Container>
        </>
    );
}

export default Blog;
