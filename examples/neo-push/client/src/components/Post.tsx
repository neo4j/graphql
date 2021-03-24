import React, { useState, useContext, useEffect, useCallback } from "react";
import { Alert, Spinner, Container, Card, Button, Form, Modal, InputGroup, FormControl } from "react-bootstrap";
import * as markdown from "./Markdown";
import { EDIT_COMMENT, POST } from "../queries";
import { graphql, auth } from "../contexts";
import { useParams, useHistory } from "react-router-dom";
import constants from "../constants";
import { POST_COMMENTS, COMMENT_ON_POST, DELETE_COMMENT, EDIT_POST, DELETE_POST } from "../queries";

interface Comment {
    id: string;
    author: {
        id: string;
        email: string;
    };
    content: string;
    post: any;
    createdAt: string;
    canDelete: boolean;
}

export interface PostInterface {
    id?: string;
    title?: string;
    content?: string;
    author?: { id: string; email: string };
    isCreator?: boolean;
    isAuthor?: boolean;
    createdAt?: string;
    canEdit?: boolean;
    canDelete?: boolean;
    blog?: { id: string };
}

function CreateComment({ post, onCreate }: { post: string; onCreate: (comment: Comment) => void }) {
    const { mutate } = useContext(graphql.Context);
    const { getId } = useContext(auth.Context);
    const [content, setContent] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (content) {
            setError("");
        }
    }, [content, setError]);

    const submit = useCallback(async () => {
        setLoading(true);

        try {
            const response = await mutate({
                mutation: COMMENT_ON_POST,
                variables: { post, content, user: getId() },
            });

            onCreate({
                id: response.commentOnPost.comments[0].id as string,
                content,
                author: {
                    id: response.commentOnPost.comments[0].author.id as string,
                    email: response.commentOnPost.comments[0].author.email as string,
                },
                post: {
                    id: post,
                },
                createdAt: response.commentOnPost.comments[0].createdAt as string,
                canDelete: true,
            });
            setContent("");
        } catch (e) {
            setError(e.message);
        }

        setLoading(false);
    }, [content, post, mutate, setLoading, setError, getId]);

    if (loading) {
        return (
            <Card className="mt-3 p-3">
                <div className="d-flex flex-column align-items-center">
                    <Spinner className="mt-5 mb-5" animation="border" />
                </div>
            </Card>
        );
    }

    return (
        <div>
            <div className="mb-3">
                <markdown.Editor markdown={content} onChange={(mk: string) => setContent(mk)}></markdown.Editor>
            </div>

            {error && (
                <Alert variant="danger text-center" className="mt-3">
                    {error}
                </Alert>
            )}
            <div className="d-flex justify-content-end">
                <Button variant="primary" className="ml-2" onClick={submit}>
                    Submit
                </Button>
            </div>
        </div>
    );
}

function DeleteComment(props: {
    comment: Comment;
    setComments: (cb: (comments: Comment[]) => any) => void;
    close: () => void;
}) {
    const { mutate } = useContext(graphql.Context);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const deleteComment = useCallback(async () => {
        setLoading(true);

        try {
            await mutate({
                mutation: DELETE_COMMENT,
                variables: { id: props.comment.id },
            });

            props.setComments((c) => c.filter((x) => x.id !== props.comment.id));
        } catch (e) {
            setError(e.message);
        }

        setLoading(false);
    }, []);

    if (loading) {
        return (
            <>
                <Modal.Header>
                    <Modal.Title>Deleting Comment</Modal.Title>
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
                <Modal.Title>Deleting Comment</Modal.Title>
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
                <Modal.Title>Delete Comment</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Alert variant="danger">Are you sure you want to delete this comment ?</Alert>
                <div className="d-flex justify-content-end">
                    <Button variant="secondary" onClick={props.close}>
                        Cancel
                    </Button>
                    <Button variant="danger" className="ml-2" onClick={deleteComment}>
                        Delete
                    </Button>
                </div>
            </Modal.Body>
        </>
    );
}

function DeletePost(props: { post: PostInterface; close: () => void }) {
    const history = useHistory();
    const { mutate } = useContext(graphql.Context);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const deletePost = useCallback(async () => {
        setLoading(true);

        try {
            await mutate({
                mutation: DELETE_POST,
                variables: { id: props.post.id },
            });

            history.push(constants.BLOG_PAGE + "/" + props.post?.blog?.id);
        } catch (e) {
            setError(e.message);
        }

        setLoading(false);
    }, []);

    if (loading) {
        return (
            <>
                <Modal.Header>
                    <Modal.Title>Delete Post {props.post.title}</Modal.Title>
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
                <Modal.Title>Delete Post {props.post.title}</Modal.Title>
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
                <Modal.Title>Delete Post {props.post.title}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Alert variant="danger">Are you sure you want to delete Post {props.post.title} ?</Alert>
                <div className="d-flex justify-content-end">
                    <Button variant="secondary" onClick={props.close}>
                        Cancel
                    </Button>
                    <Button variant="danger" className="ml-2" onClick={deletePost}>
                        Delete
                    </Button>
                </div>
            </Modal.Body>
        </>
    );
}

function CommentItem(props: { comment: Comment; setComments: (cb: (comments: Comment[]) => any) => void }) {
    const { getId } = useContext(auth.Context);
    const { mutate } = useContext(graphql.Context);
    const canEdit = getId() === props.comment.author.id;
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [editedMarkdown, setEditedMarkdown] = useState(props.comment.content);
    const [deletingComment, setDeletingComment] = useState(false);

    useEffect(() => {
        setLoading(false);
        setError("");
        setEditedMarkdown(props.comment.content);
    }, [isEditing]);

    const editComment = useCallback(async () => {
        setLoading(true);

        try {
            await mutate({
                mutation: EDIT_COMMENT,
                variables: {
                    id: props.comment.id,
                    content: editedMarkdown,
                },
            });

            props.setComments((comments) =>
                comments.map((c) => {
                    if (c.id !== props.comment.id) {
                        return c;
                    }

                    return {
                        ...c,
                        content: editedMarkdown,
                    };
                })
            );
        } catch (error) {
            setIsEditing(false);
        }

        setLoading(false);
        setIsEditing(false);
    }, [editedMarkdown, props.comment.id]);

    return (
        <Card className="mt-3 p-3">
            <Modal
                aria-labelledby="contained-modal-title-vcenter"
                centered
                size="lg"
                show={deletingComment}
                onHide={() => setDeletingComment((x) => !x)}
            >
                <DeleteComment
                    setComments={props.setComments}
                    comment={props.comment}
                    close={() => setDeletingComment(false)}
                ></DeleteComment>
            </Modal>
            <p className="text-muted">- {props.comment.author.email}</p>
            <p className="text-muted">- {props.comment.createdAt}</p>
            {isEditing ? (
                <>
                    {loading || error ? (
                        <>
                            {error && (
                                <Card className="m-3 p-3">
                                    <Alert variant="danger text-center">{error}</Alert>
                                </Card>
                            )}

                            {loading && (
                                <Card className="m-3 p-3">
                                    <div className="d-flex flex-column align-items-center">
                                        <Spinner animation="border" />
                                    </div>
                                </Card>
                            )}
                        </>
                    ) : (
                        <div className="mb-3">
                            <markdown.Editor
                                markdown={editedMarkdown}
                                onChange={(mk: string) => setEditedMarkdown(mk)}
                            ></markdown.Editor>
                        </div>
                    )}
                </>
            ) : (
                <div className="p-3">
                    <markdown.Render markdown={props.comment.content} />
                </div>
            )}
            {(props.comment.canDelete || canEdit) && (
                <div className="d-flex justify-content-start">
                    {canEdit && !isEditing && (
                        <Button variant="outline-secondary" size="sm" onClick={() => setIsEditing(true)}>
                            Edit
                        </Button>
                    )}

                    {isEditing && (
                        <>
                            <Button variant="warning" size="sm" onClick={() => setIsEditing(false)}>
                                Cancel Edit
                            </Button>
                            <Button className="ml-2" variant="primary" size="sm" onClick={() => editComment()}>
                                Submit
                            </Button>
                        </>
                    )}

                    {props.comment.canDelete && !isEditing && (
                        <Button
                            className="ml-2"
                            variant="outline-danger"
                            size="sm"
                            onClick={() => setDeletingComment(true)}
                        >
                            Delete
                        </Button>
                    )}
                </div>
            )}
        </Card>
    );
}

function PostComments({
    post,
    setComments,
    comments,
}: {
    comments: Comment[];
    post: string;
    setComments: (cb: (comments: Comment[]) => any) => void;
}) {
    const { query } = useContext(graphql.Context);
    const [skip, setSkip] = useState(0);
    const [limit] = useState(10);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const getComments = useCallback(async () => {
        try {
            const response = await query({
                query: POST_COMMENTS,
                variables: {
                    post,
                    skip: comments.length,
                    limit,
                    hasNextCommentsSkip: comments.length === 0 ? limit : comments.length + 1,
                },
            });

            setHasMore(Boolean(response.hasNextComments.length));

            setComments((c: Comment[]) => [...c, ...response.postComments]);
        } catch (e) {
            console.error(e);
            setError(e.message);
        }

        setLoading(false);
    }, [skip]);

    useEffect(() => {
        getComments();
    }, [skip]);

    if (error) {
        return (
            <Card className="mt-3 p-3">
                <h2>Comments</h2>
                <div className="d-flex flex-column align-items-center">
                    <Alert variant="danger">{error}</Alert>
                </div>
            </Card>
        );
    }

    if (loading) {
        return (
            <Card className="mt-3 p-3">
                <h2>Comments</h2>
                <div className="d-flex flex-column align-items-center">
                    <Spinner className="mt-5" animation="border" />
                </div>
            </Card>
        );
    }

    if (!comments.length) {
        return <h2>Comments</h2>;
    }

    return (
        <>
            <h2>Comments</h2>
            {comments.map((comment) => (
                <CommentItem key={comment.id} comment={comment} setComments={setComments}></CommentItem>
            ))}
            {hasMore && (
                <div className="d-flex justify-content-center w-100 mt-3">
                    <Button onClick={() => setSkip((s) => s + 1)}>Load More</Button>
                </div>
            )}
        </>
    );
}

function Post() {
    const { id } = useParams<{ id: string }>();
    const history = useHistory();
    const [post, setPost] = useState<PostInterface>({});
    const { query, mutate } = useContext(graphql.Context);
    const { isLoggedIn } = useContext(auth.Context);
    const [loading, setLoading] = useState(true);
    const [comments, setComments] = useState<Comment[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [editedMarkdown, setEditedMarkdown] = useState("");
    const [editedTitle, setEditedTitle] = useState("");
    const [deletingPost, setDeletingPost] = useState(false);

    useEffect(() => {
        setEditedMarkdown(post?.content as string);
        setEditedTitle(post?.title as string);
    }, [isEditing, post]);

    useEffect(() => {
        (async () => {
            try {
                const response = await query({
                    query: POST,
                    variables: { id },
                });

                const foundPost = response.posts[0] as PostInterface;
                if (!foundPost) {
                    history.push(constants.DASHBOARD_PAGE);
                }

                setEditedMarkdown(foundPost?.content as string);
                setPost(foundPost);
            } catch (e) {}

            setLoading(false);
        })();
    }, [id]);

    const editPost = useCallback(async () => {
        setLoading(true);

        try {
            await mutate({
                mutation: EDIT_POST,
                variables: {
                    id: id,
                    content: editedMarkdown,
                    title: editedTitle,
                },
            });

            setPost((p) => ({
                ...p,
                content: editedMarkdown,
                title: editedTitle,
            }));
        } catch (error) {
            setIsEditing(false);
        }

        setLoading(false);
        setIsEditing(false);
    }, [editedMarkdown, editedTitle, id]);

    if (loading) {
        return (
            <div className="d-flex flex-column align-items-center">
                <Spinner className="m-5" animation="border" />
            </div>
        );
    }

    return (
        <Container>
            <Modal
                aria-labelledby="contained-modal-title-vcenter"
                centered
                size="lg"
                show={deletingPost}
                onHide={() => setDeletingPost((x) => !x)}
            >
                <DeletePost post={post} close={() => setDeletingPost(false)}></DeletePost>
            </Modal>
            <Card className="mt-3 p-3">
                {isEditing ? (
                    <InputGroup className="mb-3">
                        <InputGroup.Prepend>
                            <InputGroup.Text id="title">Title</InputGroup.Text>
                        </InputGroup.Prepend>
                        <FormControl
                            size="lg"
                            onChange={(e) => setEditedTitle(e.target.value)}
                            value={editedTitle}
                            aria-label="Post Title"
                            aria-describedby="title"
                        />
                    </InputGroup>
                ) : (
                    <h1>{post.title}</h1>
                )}

                <p className="text-muted">- {post.author?.email as string}</p>
                <p className="text-muted">- {post.createdAt}</p>
                {(post.canDelete || post.canEdit) && (
                    <>
                        <hr />
                        <div className="d-flex justify-content-start">
                            {post.canEdit && !isEditing && (
                                <div className="d-flex justify-content-start">
                                    <Button variant="outline-secondary" onClick={() => setIsEditing(true)}>
                                        Edit Post
                                    </Button>
                                </div>
                            )}

                            {isEditing && (
                                <>
                                    <Button variant="warning" onClick={() => setIsEditing(false)}>
                                        Cancel Edit
                                    </Button>
                                    <Button className="ml-2" variant="primary" onClick={editPost}>
                                        Submit
                                    </Button>
                                </>
                            )}

                            {post.canDelete && !isEditing && (
                                <Button variant="outline-danger" className="ml-2" onClick={() => setDeletingPost(true)}>
                                    Delete Post
                                </Button>
                            )}
                        </div>
                    </>
                )}
            </Card>

            {isEditing ? (
                <Card className="mt-3 p-3">
                    <markdown.Editor
                        markdown={editedMarkdown}
                        onChange={(mk: string) => setEditedMarkdown(mk)}
                    ></markdown.Editor>
                </Card>
            ) : (
                <Card className="mt-3 p-3">
                    <markdown.Render markdown={post.content as string} />
                </Card>
            )}

            <Card className="mt-3 p-3 mb-3">
                <PostComments post={post.id as string} setComments={setComments} comments={comments} />

                {isLoggedIn && (
                    <div className="pt-3">
                        <CreateComment
                            post={post.id as string}
                            onCreate={(comment) => {
                                setComments((c) => [...c, comment]);
                            }}
                        ></CreateComment>
                    </div>
                )}
            </Card>
        </Container>
    );
}

export default Post;
