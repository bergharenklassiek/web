# Pull requests

Make every change on a branch and open a PR for it. Once all checks pass, squash-merge the PR and delete the branch, without asking first. If a check fails, fix it or report it, and don't merge.

# E2E tests

Select elements the way a guest finds them. In order of preference:

1. `getByRole` with a name, or `getByLabel` for form fields.
2. `getByTestId`, with a `data-testid` in the template, only for elements without a meaningful role.

Don't select on our own CSS classes, because renaming one for styling shouldn't break a test. Component tag names (`app-event-card`) and classes from libraries (`.swiper-pagination-bullet`) are fine.
