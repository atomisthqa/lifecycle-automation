import {
    EventFired,
    EventHandler,
    Tags,
} from "@atomist/automation-client";
import * as GraphQL from "@atomist/automation-client/graph/graphQL";
import * as _ from "lodash";
import { ChatTeam } from "../../../lifecycle/Lifecycle";
import * as graphql from "../../../typings/types";
import { IssueLifecycleHandler } from "./IssueLifecycle";

/**
 * Send a lifecycle message on Issue events.
 */
@EventHandler("Send a lifecycle message on Issue events",
    GraphQL.subscriptionFromFile("../../../graphql/subscription/issueToIssue", __dirname))
@Tags("lifecycle", "issue")
export class IssueToIssueLifecycle extends IssueLifecycleHandler<graphql.IssueToIssueLifecycle.Subscription> {

    protected extractNodes(event: EventFired<graphql.IssueToIssueLifecycle.Subscription>):
        [graphql.IssueToIssueLifecycle.Issue, graphql.IssueToIssueLifecycle.Repo, string] {

        const issue = event.data.Issue[0];
        const repo = event.data.Issue[0].repo;
        return [issue, repo, new Date().getTime().toString()];
    }

    protected extractChatTeams(event: EventFired<graphql.IssueToIssueLifecycle.Subscription>)
        : ChatTeam[] {
        return _.get(event, "data.Issue[0].repo.org.team.chatTeams");
    }
}
