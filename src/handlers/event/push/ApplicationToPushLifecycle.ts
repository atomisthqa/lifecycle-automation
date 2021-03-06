import {
    EventFired,
    EventHandler,
    Tags,
} from "@atomist/automation-client";
import * as GraphQL from "@atomist/automation-client/graph/graphQL";
import * as _ from "lodash";
import { ChatTeam } from "../../../lifecycle/Lifecycle";
import * as graphql from "../../../typings/types";
import { PushLifecycleHandler } from "./PushLifecycle";

/**
 * Send a lifecycle message on Application events.
 */
@EventHandler("Send a lifecycle message on Application events",
    GraphQL.subscriptionFromFile("../../../graphql/subscription/applicationToPush", __dirname))
@Tags("lifecycle", "push", "application")
export class ApplicationToPushLifecycle extends PushLifecycleHandler<graphql.ApplicationToPushLifecycle.Subscription> {

    protected extractNodes(event: EventFired<graphql.ApplicationToPushLifecycle.Subscription>):
        graphql.PushToPushLifecycle.Push[] {

        const pushes = [];
        event.data.Application[0].commits.forEach(c => pushes.push(...c.pushes));
        return pushes;
    }

    protected extractChatTeams(event: EventFired<graphql.ApplicationToPushLifecycle.Subscription>)
        : ChatTeam[] {
        return _.get(event, "data.Application[0].commits[0].pushes[0].repo.org.team.chatTeams");
    }
}
