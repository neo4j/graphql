import { Driver } from "neo4j-driver";
import { generate } from "randomstring";
import { IncomingMessage } from "http";
import { Socket } from "net";
import jsonwebtoken from "jsonwebtoken";
import { gql } from "apollo-server-express";
import * as neo4j from "../neo4j";
import server from "../server";

describe("workflow", () => {
    let driver: Driver;

    beforeAll(async () => {
        process.env.JWT_SECRET = "supersecret";
        driver = await neo4j.connect();
    });

    afterAll(async () => {
        delete process.env.JWT_SECRET;
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

        const token = jsonwebtoken.sign({ sub: user.id }, process.env.JWT_SECRET as string);

        const socket = new Socket({ readable: true });
        const req = new IncomingMessage(socket);
        req.headers.authorization = `Bearer ${token}`;

        try {
            await session.run(`
                CREATE (:User {id: "${user.id}"})
            `);

            const apolloServer = await server({ req });

            const mutate = async (str) => {
                const response = await apolloServer.mutate({
                    mutation: str,
                });

                if (response.errors) {
                    throw new Error(response.errors[0].message);
                }

                return response;
            };

            const {
                data: { createBlogs },
            } = await mutate(gql`
                    mutation {
                        createBlogs(
                            input: [
                                { 
                                    name: "${blog.initialName}",
                                    creator: {
                                        connect: {
                                            where: { id:"${user.id}" }
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

            const {
                data: { updateBlogs },
            } = await mutate(gql`
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

            const {
                data: { createPosts },
            } = await mutate(gql`
                    mutation {
                        createPosts(
                            input: [
                                { 
                                    content: "cool post"
                                    title: "${post.initialTitle}"
                                    author: {
                                        connect: {
                                            where: { id: "${user.id}" }
                                        }
                                    }
                                    blog: {
                                        connect: {
                                            where: { id: "${blog.id}" }
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

            const {
                data: { updatePosts },
            } = await mutate(gql`
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

            const {
                data: { createComments },
            } = await mutate(gql`
                    mutation {
                        createComments(
                            input: [
                                { 
                                    content: "${comment.initialContent}",
                                    author: {
                                        connect: {
                                            where: { id: "${user.id}" }
                                        }
                                    }
                                    post: {
                                        connect: {
                                            where: { id: "${post.id}" }
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

            const {
                data: { updateComments },
            } = await mutate(gql`
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

            const deleted = await mutate(gql`
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

            expect(deleted.errors).toBeUndefined();
            expect(deleted.data.deleteBlogs.nodesDeleted).toEqual(3);
        } finally {
            await session.close();
        }
    });
});
