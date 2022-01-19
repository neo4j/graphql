# Hotfix Process

## Problem

We currently have no mechanism to release critical bug fixes whilst we are working on larger features or releases on `dev`.

## Proposed Solution

Bug fixes which are to be released as hotfixes should be implemented and released as follows:

1. Create a new bug fix branch from `master`
2. Implement the bug fix
3. Create a PR to merge the bug fix branch into `master`
4. Once the branch has been merged, create a release branch (`release/<major>.<minor>.<patch>`) off `master`
5. This will trigger the release pipeline which will test, build and release the hotfix

## Risks

- Whilst the merge into `master` following release will always occur smoothly, there is a risk that there will be conflicts merging into `dev`
  - If this occurs, the pipeline will fail following the release, and the merge into `dev` will have to be done manually
