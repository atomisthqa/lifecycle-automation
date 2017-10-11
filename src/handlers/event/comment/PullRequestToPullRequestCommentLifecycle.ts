import {
    EventHandler,
    Tags,
} from "@atomist/automation-client/decorators";
import * as GraphQL from "@atomist/automation-client/graph/graphQL";
import { EventFired } from "@atomist/automation-client/Handlers";
import * as _ from "lodash";
import * as graphql from "../../../typings/types";
import { CommentLifecycleHandler } from "./CommentLifecycle";

/**
 * A Event handler that sends a lifecycle message on PullRequest events.
 */
@EventHandler("Event handler that sends a lifecycle message on PullRequest events",
    GraphQL.subscriptionFromFile("graphql/subscription/pullRequestToPullRequestComment"))
@Tags("lifecycle", "pullrequest")
export class PullRequestToPullRequestCommentLifecycle
    extends CommentLifecycleHandler<graphql.PullRequestToPullRequestCommentLifecycle.Subscription> {

    protected extractNodes(event: EventFired<graphql.PullRequestToPullRequestCommentLifecycle.Subscription>):
        [graphql.PullRequestToPullRequestCommentLifecycle.Comments[],
            graphql.IssueToIssueCommentLifecycle.Issue,
            graphql.PullRequestToPullRequestCommentLifecycle.PullRequest,
            graphql.PullRequestToPullRequestCommentLifecycle.Repo,
            boolean] {

        const pr = event.data.PullRequest[0];
        if (pr) {
            return [pr.comments.sort((c1, c2) =>
                c1.timestamp.localeCompare(c2.timestamp)), null, pr, _.get(pr, "repo"), true];
        } else {
            return [null, null, null, null, true];
        }
    }
}
