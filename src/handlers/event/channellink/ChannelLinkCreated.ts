import {
    EventFired,
    EventHandler,
    failure,
    HandleEvent,
    HandlerContext,
    HandlerResult,
    Secret,
    Secrets,
    Success,
    Tags,
} from "@atomist/automation-client";
import * as GraqhQL from "@atomist/automation-client/graph/graphQL";
import { guid } from "@atomist/automation-client/internal/util/string";
import { addressSlackChannels, buttonForCommand } from "@atomist/automation-client/spi/message/MessageClient";
import { Action } from "@atomist/slack-messages";
import {
    bold,
    codeLine,
    SlackMessage,
} from "@atomist/slack-messages/SlackMessages";
import * as _ from "lodash";
import * as graphql from "../../../typings/types";
import {
    apiUrl,
    repoSlackLink,
} from "../../../util/helpers";
import { warning } from "../../../util/messages";
import * as github from "../../command/github/gitHubApi";
import { InstallGitHubOrgWebhook, InstallGitHubRepoWebhook } from "../../command/github/InstallGitHubWebhook";
import { ListRepoLinks } from "../../command/slack/ListRepoLinks";

@EventHandler("Display an unlink message when a channel is linked",
    GraqhQL.subscriptionFromFile("../../../graphql/subscription/channelLinkCreated", __dirname))
@Tags("enrollment")
export class ChannelLinkCreated implements HandleEvent<graphql.ChannelLinkCreated.Subscription> {

    @Secret(Secrets.OrgToken)
    public orgToken: string;

    public handle(event: EventFired<graphql.ChannelLinkCreated.Subscription>,
                  ctx: HandlerContext): Promise<HandlerResult> {
        const msgId = guid();
        const channelName = event.data.ChannelLink[0].channel.name || event.data.ChannelLink[0].channel.normalizedName;
        const teamId = event.data.ChannelLink[0].channel.team.id;
        const repo = event.data.ChannelLink[0].repo;
        const repoLink = repoSlackLink(repo);

        const linkMsg = `${repoLink} is now linked to this channel. I will send activity from that \
repository here. To turn this off, type ${codeLine("@atomist repos")} and click the ${bold("Unlink")} button.`;

        const noRepoHookMsg = `${repoLink} is now linked to this channel. Unfortunately I'm not able to send \
activity from that repository here because there is no Webhook installed. \
Please use the button below to install a Webhook in your repository.`;

        const noHookMsg = `${repoLink} is now linked to this channel. Unfortunately I'm not able to send \
activity from that repository here because there is no Webhook installed. \
Please use one of the buttons below to install a Webhook in your repository or organization.`;

        const api = github.api(this.orgToken, apiUrl(repo));
        return api.repos.getHooks({
            owner: repo.owner,
            repo: repo.name,
        })
        .then(result => {
            return hookExists(result.data);
        }, () => {
            return false;
        })
        .then(exists => {
            if (exists) {
                return true;
            } else if (repo.org.ownerType === "organization") {
                return ctx.graphClient.executeQueryFromFile<graphql.Webhook.Query, graphql.Webhook.Variables>(
                    "../../../graphql/query/webhook",
                    { owner: repo.owner },
                    {},
                    __dirname)
                .then(result => {
                    return _.get(result, "GitHubOrgWebhook[0].url") != null;
                })
                .catch(() => {
                    return false;
                });
            } else {
                return false;
            }
        })
        .then(exists => {
            if (exists) {
                const msg: SlackMessage = {
                    attachments: [{
                        author_icon: `https://images.atomist.com/rug/check-circle.gif?gif=${guid()}`,
                        author_name: "Channel Linked",
                        text: linkMsg,
                        fallback: linkMsg,
                        color: "#45B254",
                        mrkdwn_in: [ "text" ],
                        actions: [
                            createListRepoLinksAction(msgId),
                        ],
                    }],
                };
                return ctx.messageClient.send(msg, addressSlackChannels(teamId, channelName), { id: msgId });
            } else {
                let text;
                if (repo.org.ownerType === "organization") {
                    text = noHookMsg;
                } else {
                    text = noRepoHookMsg;
                }
                return ctx.messageClient.send(
                    warning("Channel Linked", text, ctx,
                        [...createActions(repo), createListRepoLinksAction(msgId)]),
                    addressSlackChannels(teamId, channelName),
                    { id: msgId });
            }
        })
        .then(() => Success, failure);
    }
}

export function hookExists(hooks: any[]): boolean {
    if (hooks && Array.isArray(hooks) && hooks.length > 0) {
        const urlRegexp = /^https:\/\/.+.atomist.+\/github\/teams.*$/;
        return hooks.filter(w => w.config && w.config.url)
            .some(w => urlRegexp.test(w.config.url));
    }
    return false;
}

function createActions(repo: graphql.ChannelLinkCreated.Repo): Action[] {
    const actions: Action[] = [];

    const repoHook = new InstallGitHubRepoWebhook();
    repoHook.owner = repo.owner;
    repoHook.repo = repo.name;
    actions.push(buttonForCommand({ text: "Install Repository Webhook"}, repoHook));

    if (repo.org.ownerType === "organization") {
        const orgHook = new InstallGitHubOrgWebhook();
        orgHook.owner = repo.owner;
        actions.push(buttonForCommand({ text: "Install Organization Webhook"}, orgHook));
    }

    return actions;
}

function createListRepoLinksAction(msgId: string): Action {
    const repoList = new ListRepoLinks();
    repoList.msgId = msgId;
    return buttonForCommand({ text: "List Repository Links" }, repoList);
}
