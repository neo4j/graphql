import faker from "faker";
import { ogm } from "./gql";
import * as neo4j from "./neo4j";
import createDebug from "./debugger";
import { hashPassword } from "./utils";

const debug = createDebug("Seeder");
const User = ogm.model("User");
const Blog = ogm.model("Blog");
const Post = ogm.model("Post");
const Comment = ogm.model("Comment");

const defaultEmail = "admin@admin.com";
const defaultPassword = "password";

async function main() {
    debug("Seeding Started");

    await neo4j.connect();

    await Promise.all([User, Blog, Post, Comment].map((m) => m.delete({})));

    const { users } = await User.create({
        input: await Promise.all(
            [
                [defaultEmail, defaultPassword],
                [faker.internet.email(), faker.internet.password()],
                [faker.internet.email(), faker.internet.password()],
            ].map(async ([email, password]) => {
                return {
                    email,
                    password: await hashPassword(password),
                };
            })
        ),
    });

    await Blog.create({
        input: users.flatMap((user) => {
            return new Array(3).fill(null).map(() => {
                return {
                    name: faker.lorem.word(),
                    creator: {
                        connect: { where: { node: { id: user.id } } },
                    },
                    posts: {
                        create: new Array(5).fill(null).map(() => ({
                            node: {
                                title: faker.lorem.word(),
                                content: faker.lorem.paragraphs(4),
                                author: {
                                    connect: { where: { node: { id: user.id } } },
                                },
                                comments: {
                                    create: new Array(5).fill(null).map(() => {
                                        const u = users[Math.floor(Math.random() * users.length)];

                                        return {
                                            node: {
                                                content: faker.lorem.paragraph(),
                                                author: {
                                                    connect: { where: { node: { id: u.id } } },
                                                },
                                            },
                                        };
                                    }),
                                },
                            },
                        })),
                    },
                };
            });
        }),
    });

    await neo4j.disconnect();

    debug("Seeding Finished");
}

main();
