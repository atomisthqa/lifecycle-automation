import { EventHandler, Tags } from "@atomist/automation-client/decorators";
import * as GraphQL from "@atomist/automation-client/graph/graphQL";
import { EventFired } from "@atomist/automation-client/Handlers";
import * as graphql from "../../../typings/types";
import { PushLifecycleHandler } from "./PushLifecycle";

/**
 * A Event handler that sends a lifecycle message on Tag events.
 */
@EventHandler("Event handler that sends a lifecycle message on Tag events",
    GraphQL.subscriptionFromFile("graphql/subscription/tagToPush"))
@Tags("lifecycle", "push", "tag ")
export class TagToPushLifecycle extends PushLifecycleHandler<graphql.TagToPushLifecycle.Subscription> {

    protected extractNodes(event: EventFired<graphql.TagToPushLifecycle.Subscription>):
        [graphql.PushToPushLifecycle.Push[], string] {

        const pushes = event.data.Tag[0].commit.pushes;
        return [pushes, event.data.Tag[0].timestamp];
    }
}
