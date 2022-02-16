# Hotfix Process

## Problem

We currently have no mechanism to release critical bug fixes whilst we are working on larger features or releases on `dev`.

## Proposed Solution

Bug fixes which are to be released as hotfixes should be implemented and released as follows:

1. Create a new bug fix branch from `master`
2. Implement the bug fix
3. Create a PR to merge the bug fix branch into `master`
4. Once the branch has been merged, create a hotfix branch (`hotfix/<major>.<minor>.<patch>`) off `master`
5. This will trigger the release pipeline which will test, build and release the hotfix
6. The hotfix branch will then be merged into `dev`, which result in either of the outcomes below

### The merge into `dev` occurs successfully

1. Check the commit to see if anything was "rolled back", for instance if any dependency versions went down
2. If you see any defects, create a new branch from `dev`, fix them and open a PR to merge them in

### The merge into `dev` fails with merge conflicts

1. In your fork, merge the hotfix branch into `dev`
2. Fix any merge conflicts
3. Push the result, and open a PR to merge the changes from your forked `dev` into the main repo `dev`

## Risks

- Whilst the merge into `master` following release will always occur smoothly, there is a risk that there will be conflicts merging into `dev`
  - If this occurs, the pipeline will fail following the release, and the merge into `dev` will have to be done manually
