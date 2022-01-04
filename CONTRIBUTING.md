# Welcome to the Neo4j GraphQL contributing guide

Thank you for investing your time in contributing to our projects! Any contribution
you make will be reflected in the published Neo4j GraphQL packages.

Read our [Code of Conduct](./CODE_OF_CONDUCT.md) to keep our community friendly
and respectable.

In this guide you will get a brief overview of the contribution workflow from
opening an issue, creating a PR, the review process and the merge of a PR.

This is a high-level process overview, and a slightly more technical deep-dive
is available in [the development guide](./docs/contributing/DEVELOPING.md).

## Getting started

### Issues

If you have a bug to report or feature to request, first
[search to see if an issue already exists](https://docs.github.com/en/github/searching-for-information-on-github/searching-on-github/searching-issues-and-pull-requests#search-by-the-title-body-or-comments).
If a related issue doesn't exist, please raise a new issue using the relevant
[issue form](https://github.com/neo4j/graphql/issues/new/choose).

If you're a Neo4j Enterprise customer, you can also reach out to [Customer Support](http://support.neo4j.com/).

If you don't have a bug to report or feature request, but you need a hand with
the library; community support is available via [Neo4j Online Community](https://community.neo4j.com/)
and/or [Discord](https://discord.gg/neo4j).

### Make changes

1. Fork the respository.
2. Install Node.js and Yarn. For more information, see [the development guide](./docs/contributing/DEVELOPING.md).
3. Create a working branch from `dev` and start with your changes!

### Pull request

When you're finished with your changes, create a pull request, also known as a PR.

* Ensure that you have [signed the CLA](https://neo4j.com/developer/contributing-code/#sign-cla).
* Ensure that the base of your PR is set to `dev`.
* Fill out the template so that we can easily review your PR. The template helps
reviewers understand your changes as well as the purpose of the pull request.
* Don't forget to [link your PR to an issue](https://docs.github.com/en/issues/tracking-your-work-with-issues/linking-a-pull-request-to-an-issue)
if you are solving one.
* Enable the checkbox to [allow maintainer edits](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/allowing-changes-to-a-pull-request-branch-created-from-a-fork)
so that maintainers can make any necesssary tweaks and update your branch for merge.
* Reviewers may ask for changes to be made before a PR can be merged, either using
[suggested changes](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/reviewing-changes-in-pull-requests/incorporating-feedback-in-your-pull-request)
or normal pull request comments. You can apply suggested changes directly through
the UI, and any other changes can be made in your fork and committed to the PR branch.
* As you update your PR and apply changes, mark each conversation as [resolved](https://docs.github.com/en/github/collaborating-with-issues-and-pull-requests/commenting-on-a-pull-request#resolving-conversations).

### Your PR is merged

Congratulations and thank you for your contribution! 🎉

Once your PR is merged, it will be available in the next release.
