import {
    EventFired,
    EventHandler,
    Tags,
} from "@atomist/automation-client";
import * as GraphQL from "@atomist/automation-client/graph/graphQL";
import * as _ from "lodash";
import { ChatTeam } from "../../../lifecycle/Lifecycle";
import * as graphql from "../../../typings/types";
import { PullRequestLifecycleHandler } from "./PullRequestLifecycle";

/**
 * Send a lifecycle message on PullRequest events.
 */
@EventHandler("Send a lifecycle message on PullRequest events",
    GraphQL.subscriptionFromFile("../../../graphql/subscription/pullRequestToPullRequest", __dirname))
@Tags("lifecycle", "pr")
export class PullRequestToPullRequestLifecycle
    extends PullRequestLifecycleHandler<graphql.PullRequestToPullRequestLifecycle.Subscription> {

    protected extractNodes(event: EventFired<graphql.PullRequestToPullRequestLifecycle.Subscription>):
        [graphql.PullRequestToPullRequestLifecycle.PullRequest,
            graphql.PullRequestToPullRequestLifecycle.Repo,
            string, boolean] {

        return [event.data.PullRequest[0], event.data.PullRequest[0].repo, Date.now().toString(), false];
    }

    protected extractChatTeams(event: EventFired<graphql.PullRequestToPullRequestLifecycle.Subscription>)
        : ChatTeam[] {
        return _.get(event, "data.PullRequest[0].repo.org.team.chatTeams");
    }
}
