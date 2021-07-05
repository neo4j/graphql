import gql from "graphql-tag";

export const SIGNIN = gql`
    mutation signIn($email: String!, $password: String!) {
        signIn(email: $email, password: $password)
    }
`;

export const SIGNUP = gql`
    mutation signUp($email: String!, $password: String!) {
        signUp(email: $email, password: $password)
    }
`;

export const USER = gql`
    query user($id: ID) {
        users(where: { id: $id }) {
            email
        }
    }
`;

export const CREATE_BLOG = gql`
    mutation($name: String!, $sub: ID) {
        createBlogs(input: [{ name: $name, creator: { connect: { where: { node: { id: $sub } } } } }]) {
            blogs {
                id
                name
                createdAt
            }
        }
    }
`;

export const MY_BLOGS = gql`
    query myBlogs($id: ID, $skip: Int, $limit: Int, $hasNextBlogsSkip: Int) {
        myBlogs: blogs(
            where: { OR: [{ creator: { id: $id } }, { authors: { id: $id } }] }
            options: { limit: $limit, skip: $skip, sort: { createdAt: DESC } }
        ) {
            id
            name
            creator {
                id
                email
            }
            createdAt
        }
        hasNextBlogs: blogs(
            where: { OR: [{ creator: { id: $id } }, { authors: { id: $id } }] }
            options: { limit: 1, skip: $hasNextBlogsSkip, sort: { createdAt: DESC } }
        ) {
            id
        }
    }
`;

export const RECENTLY_UPDATED_BLOGS = gql`
    query recentlyUpdatedBlogs($skip: Int, $limit: Int, $hasNextBlogsSkip: Int) {
        recentlyUpdatedBlogs: blogs(options: { limit: $limit, skip: $skip, sort: { updatedAt: DESC } }) {
            id
            name
            creator {
                id
                email
            }
            updatedAt
        }
        hasNextBlogs: blogs(options: { limit: 1, skip: $hasNextBlogsSkip, sort: { updatedAt: DESC } }) {
            id
        }
    }
`;

export const BLOG = gql`
    query($id: ID) {
        blogs(where: { id: $id }) {
            id
            name
            creator {
                id
                email
            }
            authors {
                id
                email
            }
            createdAt
            isCreator
            isAuthor
        }
    }
`;

export const EDIT_BLOG = gql`
    mutation editBlog($id: ID, $name: String) {
        updateBlogs(where: { id: $id }, update: { name: $name }) {
            blogs {
                id
            }
        }
    }
`;

export const DELETE_BLOG = gql`
    mutation deleteBlog($id: ID) {
        deleteComments(where: { post: { blog: { id: $id } } }) {
            nodesDeleted
        }
        deletePosts(where: { blog: { id: $id } }) {
            nodesDeleted
        }
        deleteBlogs(where: { id: $id }) {
            nodesDeleted
        }
    }
`;

export const CREATE_POST = gql`
    mutation createPost($title: String!, $content: String!, $user: ID, $blog: ID) {
        createPosts(
            input: [
                {
                    title: $title
                    content: $content
                    blog: { connect: { where: { node: { id: $blog } } } }
                    author: { connect: { where: { node: { id: $user } } } }
                }
            ]
        ) {
            posts {
                id
            }
        }
    }
`;

export const POST = gql`
    query post($id: ID) {
        posts(where: { id: $id }) {
            id
            title
            content
            author {
                email
            }
            createdAt
            canEdit
            canDelete
            blog {
                id
            }
        }
    }
`;

export const BLOG_POSTS = gql`
    query blogPosts($blog: ID, $skip: Int, $limit: Int, $hasNextPostsSkip: Int) {
        blogPosts: posts(
            where: { blog: { id: $blog } }
            options: { skip: $skip, limit: $limit, sort: { createdAt: DESC } }
        ) {
            id
            title
            author {
                email
            }
            createdAt
        }
        hasNextPosts: posts(
            where: { blog: { id: $blog } }
            options: { skip: $hasNextPostsSkip, limit: 1, sort: { createdAt: DESC } }
        ) {
            id
        }
    }
`;

export const COMMENT_ON_POST = gql`
    mutation commentOnPost($post: ID, $content: String!, $user: ID) {
        commentOnPost: createComments(
            input: [
                {
                    content: $content
                    post: { connect: { where: { node: { id: $post } } } }
                    author: { connect: { where: { node: { id: $user } } } }
                }
            ]
        ) {
            comments {
                id
                content
                author {
                    id
                    email
                }
                createdAt
            }
        }
    }
`;

export const POST_COMMENTS = gql`
    query postComments($post: ID, $skip: Int, $limit: Int, $hasNextCommentsSkip: Int) {
        postComments: comments(
            where: { post: { id: $post } }
            options: { skip: $skip, limit: $limit, sort: { createdAt: ASC } }
        ) {
            id
            author {
                id
                email
            }
            content
            createdAt
            canDelete
        }
        hasNextComments: comments(
            where: { post: { id: $post } }
            options: { skip: $hasNextCommentsSkip, limit: 1, sort: { createdAt: ASC } }
        ) {
            id
        }
    }
`;

export const EDIT_COMMENT = gql`
    mutation updateComment($id: ID, $content: String) {
        updateComments(where: { id: $id }, update: { content: $content }) {
            comments {
                id
            }
        }
    }
`;

export const DELETE_COMMENT = gql`
    mutation deleteComment($id: ID) {
        deleteComments(where: { id: $id }) {
            nodesDeleted
        }
    }
`;

export const EDIT_POST = gql`
    mutation editPost($id: ID, $content: String, $title: String) {
        updatePosts(where: { id: $id }, update: { content: $content, title: $title }) {
            posts {
                id
            }
        }
    }
`;

export const DELETE_POST = gql`
    mutation deletePost($id: ID) {
        deleteComments(where: { post: { id: $id } }) {
            nodesDeleted
        }
        deletePosts(where: { id: $id }) {
            nodesDeleted
        }
    }
`;

export const ASSIGN_BLOG_AUTHOR = gql`
    mutation assignBlogAuthor($blog: ID, $authorEmail: String) {
        updateBlogs(where: { id: $blog }, connect: { authors: { where: { node: { email: $authorEmail } } } }) {
            blogs {
                authors {
                    email
                }
            }
        }
    }
`;

export const REVOKE_BLOG_AUTHOR = gql`
    mutation revokeBlogAuthor($blog: ID, $authorEmail: String) {
        updateBlogs(where: { id: $blog }, disconnect: { authors: { where: { email: $authorEmail } } }) {
            blogs {
                authors {
                    email
                }
            }
        }
    }
`;
