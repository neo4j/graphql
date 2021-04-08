# Contributing

At [Neo4j](http://neo4j.com/), we develop our software in the open at GitHub.
This provides transparency for you, our users, and allows you to fork the software to make your own additions and enhancements.
We also provide areas specifically for community contributions, in particular the [neo4j-contrib](https://github.com/neo4j-contrib) space.

There's an active [Neo4j Online Community](https://community.neo4j.com/) where we work directly with the community.
If you're not already a member, sign up!

## Need to raise an issue?

Where you raise an issue depends largely on the nature of the problem.

Firstly, if you are an Enterprise customer, you might want to head over to our [Customer Support Portal](http://support.neo4j.com/).

There are plenty of public channels available too, though.
If you simply want to get started or have a question on how to use a particular feature, ask a question in [Neo4j Online Community](https://community.neo4j.com/).
If you think you might have hit a bug in our software (it happens occasionally!) or you have specific feature request then use the issue feature at [Github Issues](https://github.com/neo4j/graphql/issues).
Check first though as someone else may have already raised something similar.

Include as much information as you can in any request you make:

-   Which versions of our products are you using?
-   What does your Schema, or a section of it, looks like ?
-   What operating system are you on?
-   What query caused the problem?
-   What errors are you seeing?
-   What solutions have you tried already?

## Submitting your contribution

If you want to contribute a pull request, we have a little bit of process you'll need to follow:

-   Do all your work in a personal fork of the original repository
-   Create a branch (with a useful name) for your contribution
-   Make sure you're familiar with the appropriate coding style (this varies by language so ask if you're in doubt)
-   Include tests if appropriate (obviously not necessary for documentation changes)
-   Take a moment to read and sign our [CLA](http://neo4j.com/developer/cla)
-   Include a detailed PR description answering the; what, why, and how of your contribution

We can't guarantee that we'll accept pull requests and may ask you to make some changes before they go in.
Occasionally, we might also have logistical, commercial, or legal reasons why we can't accept your work but we'll try to find an alternative way for you to contribute in that case.

## Got an idea for a new project?

If you have an idea for a new tool or library, start by talking to other people in the community.
Chances are that someone has a similar idea or may have already started working on it.
The best software comes from getting like minds together to solve a problem.
And we'll do our best to help you promote and co-ordinate your Neo ecosystem projects.

## Getting started locally

> This is a TypeScript Monorepo managed with [Yarn Workspaces](https://classic.yarnpkg.com/en/docs/workspaces/).

### Forking

First make a fork of the monorepo, once done clone your fork locally;

```
$ git clone https://github.com/neo4j/graphql.git
```

### Node

Please use the LTS version of Node; 14.15.3 as of writing.

### Installing

The library is part of a monorepo, at the root, run;

```
$ yarn
```

### Linting

This library uses eslint with AirBnb style. Please use either use a IDE or format your code before submitting a PR. The recommend setup would be VSCode and Prettier.

### Testing

You will need a running neo4j instance unless your using Docker.

#### Local Neo4j

From the root run

```
cross-env NEO_USER=YOUR_USER NEO_PASSWORD_YOUR_PASSWORD NEO_URL=YOUR_URL yarn run test
```

#### Docker 🐋

From the root run

```
docker-compose -f ./docker-compose.test.yml up --build --abort-on-container-exit --exit-code-from test
```

## Further reading

If you want to find out more about how you can contribute, head over to our website for [more information](http://neo4j.com/developer/contributing-code/).
