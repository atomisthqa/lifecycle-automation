import {
    failure,
    HandlerResult,
    logger,
    Success,
} from "@atomist/automation-client";
import * as graphql from "../../../typings/types";
import { apiUrl } from "../../../util/helpers";
import * as github from "../../command/github/gitHubApi";

export const AutoMergeLabel = "atomist:auto-merge";
export const AutoMergeTag = "atomist:auto-merge-enabled";

export function autoMerge(pr: graphql.AutoMergeOnReview.PullRequest, token: string): Promise<HandlerResult> {
    if (pr) {
        // Couple of rules for auto-merging
        // 1. at least one approved review
        if (!pr.reviews || pr.reviews.length === 0) {
            return Promise.resolve(Success);
        } else if (pr.reviews.some(r => r.state !== "approved")) {
            return Promise.resolve(Success);
        }

        // 2. all status checks are successful and there is at least one check
        if (pr.head && pr.head.statuses && pr.head.statuses.length > 0) {
            if (pr.head.statuses.some(s => s.state !== "success")) {
                return Promise.resolve(Success);
            }
        } else {
            return Promise.resolve(Success);
        }

        if (isPrTagged(pr)) {
            const api = github.api(token, apiUrl(pr.repo));

            return api.pullRequests.get({
                owner: pr.repo.owner,
                repo: pr.repo.name,
                number: pr.number,
            })
            .then(gpr => {
                if (gpr.data.mergeable) {
                    return api.pullRequests.merge({
                        owner: pr.repo.owner,
                        repo: pr.repo.name,
                        number: pr.number,
                        merge_method: "merge",
                        sha: pr.head.sha,
                        commit_title: `Auto merge pull request #${pr.number} from ${pr.repo.owner}/${pr.repo.name}`,
                    })
                    .then(() => {
                        const body = `Pull request auto merged by Atomist.

* ${pr.reviews.length} approved ${pr.reviews.length > 1 ? "reviews" : "review"} by ${pr.reviews.map(
                            r => `${r.by.map(b => `@${b.login}`).join(", ")}`).join(", ")}
* ${pr.head.statuses.length} successful ${pr.head.statuses.length > 1 ? "checks" : "check"}`;

                        return api.issues.createComment({
                            owner: pr.repo.owner,
                            repo: pr.repo.name,
                            number: pr.number,
                            body,
                        });
                    })
                    .then(() => {
                        return api.gitdata.deleteReference({
                            owner: pr.repo.owner,
                            repo: pr.repo.name,
                            ref: `heads/${pr.branch.name.trim()}`,
                        });
                    })
                    .then(() => Success);
                } else {
                    logger.info("GitHub returned PR as not mergeable: '%j'", gpr.data);
                    return Promise.resolve(Success);
                }
            })
            .catch(err => failure(err));
        }
    }
    return Promise.resolve(Success);
}

export function isPrTagged(pr: graphql.AutoMergeOnReview.PullRequest) {
    // 0. check labels
    if (pr.labels && pr.labels.some(l => l.name === AutoMergeLabel)) {
        return true;
    }

    // 1. check body and title for auto merge marker
    if (isTagged(pr.title) || isTagged(pr.body)) {
        return true;
    }

    // 2. PR comment that contains the merger
    if (pr.comments && pr.comments.some(c => isTagged(c.body))) {
        return true;
    }

    // 3. Commit message containing the auto merge marker
    if (pr.commits && pr.commits.some(c => isTagged(c.message))) {
        return true;
    }

    return false;
}

export function isTagged(msg: string) {
    return msg && msg.indexOf(AutoMergeTag) >= 0;
}
