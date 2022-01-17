import { Driver } from "neo4j-driver";
import { generate } from "randomstring";
import { IncomingMessage } from "http";
import { Socket } from "net";
import { gql } from "apollo-server-express";
import * as neo4j from "../neo4j";
import server from "../server";
import { createJWT } from "../../../src/utils";

describe("workflow", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j.connect();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should allow user to create blog edit the blog, create a post, edit the post, create a comment, edit the comment and delete everything", async () => {
        const session = driver.session();

        const user = {
            id: generate({
                charset: "alphabetic",
            }),
        };

        const blog = {
            id: "",
            initialName: generate({
                charset: "alphabetic",
            }),
            updatedName: generate({
                charset: "alphabetic",
            }),
        };

        const post = {
            id: generate({
                charset: "alphabetic",
            }),
            initialTitle: generate({
                charset: "alphabetic",
            }),
            updatedTitle: generate({
                charset: "alphabetic",
            }),
        };

        const comment = {
            id: generate({
                charset: "alphabetic",
            }),
            initialContent: generate({
                charset: "alphabetic",
            }),
            updatedContent: generate({
                charset: "alphabetic",
            }),
        };

        const token = await createJWT({ sub: user.id });

        const socket = new Socket({ readable: true });
        const req = new IncomingMessage(socket);
        req.headers.authorization = `Bearer ${token}`;

        try {
            await session.run(`
                CREATE (:User {id: "${user.id}"})
            `);

            const apolloServer = server(driver, { req });

            const mutate = async (str) => {
                const response = await apolloServer.executeOperation({
                    query: str,
                });

                if (response.errors) {
                    throw new Error(response.errors[0].message);
                }

                return response.data as any;
            };

            const { createBlogs } = await mutate(gql`
                    mutation {
                        createBlogs(
                            input: [
                                {
                                    name: "${blog.initialName}",
                                    creator: {
                                        connect: {
                                            where: { node: { id:"${user.id}" } }
                                        }
                                    }
                                }
                            ]
                        ) {
                            blogs {
                                id
                                name
                            }
                        }
                    }
            `);
            expect(createBlogs.blogs[0].name).toEqual(blog.initialName);
            blog.id = createBlogs.blogs[0].id;

            const { updateBlogs } = await mutate(gql`
                    mutation {
                        updateBlogs(where: { id: "${blog.id}" }, update: { name: "${blog.updatedName}" }) {
                            blogs {
                                id
                                name
                            }
                        }
                    }
            `);
            expect(updateBlogs.blogs[0].name).toEqual(blog.updatedName);

            const { createPosts } = await mutate(gql`
                    mutation {
                        createPosts(
                            input: [
                                {
                                    content: "cool post"
                                    title: "${post.initialTitle}"
                                    author: {
                                        connect: {
                                            where: { node: { id: "${user.id}" } }
                                        }
                                    }
                                    blog: {
                                        connect: {
                                            where: { node: { id: "${blog.id}" } }
                                        }
                                    }
                                }
                            ]
                        ) {
                            posts {
                                id
                                title
                            }
                        }
                    }
            `);
            expect(createPosts.posts[0].title).toEqual(post.initialTitle);
            post.id = createPosts.posts[0].id;

            const { updatePosts } = await mutate(gql`
                    mutation {
                        updatePosts(where: { id: "${post.id}" }, update: { title: "${post.updatedTitle}" }) {
                            posts {
                                id
                                title
                            }
                        }
                    }
            `);
            expect(updatePosts.posts[0].title).toEqual(post.updatedTitle);

            const { createComments } = await mutate(gql`
                    mutation {
                        createComments(
                            input: [
                                {
                                    content: "${comment.initialContent}",
                                    author: {
                                        connect: {
                                            where: { node: { id: "${user.id}" } }
                                        }
                                    }
                                    post: {
                                        connect: {
                                            where: { node: { id: "${post.id}" } }
                                        }
                                    }
                                }
                            ]
                        ) {
                            comments {
                                id
                                content
                            }
                        }
                    }
            `);
            expect(createComments.comments[0].content).toEqual(comment.initialContent);
            comment.id = createComments.comments[0].id;

            const { updateComments } = await mutate(gql`
                    mutation {
                        updateComments(where: { id: "${comment.id}" }, update: { content: "${comment.updatedContent}" }) {
                            comments {
                                id
                                content
                            }
                        }
                    }
            `);
            expect(updateComments.comments[0].content).toEqual(comment.updatedContent);

            const { deleteBlogs } = await mutate(gql`
                mutation {
                    deleteBlogs(
                        where: { id: "${blog.id}" },
                        delete: {
                            posts: {
                                where: {},
                                delete: {
                                    comments: {
                                        where: {}
                                    }
                                }
                            }
                        }
                        ) {
                        nodesDeleted
                    }
                }
            `);

            expect(deleteBlogs.nodesDeleted).toEqual(3);
        } finally {
            await session.close();
        }
    });
});
