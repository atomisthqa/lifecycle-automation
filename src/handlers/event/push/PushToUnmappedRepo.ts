import {
    EventFired,
    EventHandler,
    failure,
    HandleEvent,
    HandlerContext,
    HandlerResult,
    Success,
    Tags,
} from "@atomist/automation-client";
import * as GraphQL from "@atomist/automation-client/graph/graphQL";
import { buttonForCommand } from "@atomist/automation-client/spi/message/MessageClient";
import * as slack from "@atomist/slack-messages/SlackMessages";
import * as graphql from "../../../typings/types";
import {
    isDmDisabled,
    repoChannelName,
    repoSlackLink,
} from "../../../util/helpers";
import { SetUserPreference } from "../../command/preferences/SetUserPreference";
import { AssociateRepo } from "../../command/slack/AssociateRepo";
import { CreateChannel } from "../../command/slack/CreateChannel";
import { DefaultBotName, LinkRepo } from "../../command/slack/LinkRepo";
import { DirectMessagePreferences } from "../preferences";

/**
 * Suggest mapping a repo to committer on unmapped repo.
 */
@EventHandler("Suggest mapping a repo to committer on unmapped repo",
    GraphQL.subscriptionFromFile("graphql/subscription/pushToUnmappedRepo"))
@Tags("lifecycle", "push")
export class PushToUnmappedRepo implements HandleEvent<graphql.PushToUnmappedRepo.Subscription> {

    public handle(e: EventFired<graphql.PushToUnmappedRepo.Subscription>, ctx: HandlerContext): Promise<HandlerResult> {
        return Promise.all(e.data.Push.map(p => {
            if (p.repo && p.repo.channels && p.repo.channels.length > 0) {
                // already mapped
                return Success;
            }
            if (!p.commits || p.commits.length < 1) {
                // strange
                return Success;
            }
            if (p.commits.some(c => c.message === "Initial commit")) {
                // not on initial push
                return Success;
            }

            const botName = (p.repo.org && p.repo.org.chatTeam && p.repo.org.chatTeam.members &&
                p.repo.org.chatTeam.members.length > 0 &&
                p.repo.org.chatTeam.members.some(m => m.isAtomistBot === "true")) ?
                p.repo.org.chatTeam.members.find(m => m.isAtomistBot === "true").screenName : DefaultBotName;

            const chatIds = p.commits.filter(c => c.author && c.author.person).map(c => c.author.person.chatId);

            return sendUnMappedRepoMessage(chatIds, p.repo, ctx, botName);
        }))
            .then(() => Success, failure);
    }

}

const repoMappingConfigKey = "repo_mapping_flow";
const disabledReposConfigKey = "disabled_repos";

export function sendUnMappedRepoMessage(
    chatIds: graphql.PushToUnmappedRepo.ChatId[],
    repo: graphql.PushToUnmappedRepo.Repo,
    ctx: HandlerContext,
    botName: string = DefaultBotName,
): Promise<HandlerResult> {

    const enabledChatIds = chatIds.filter(c => {
        return !isDmDisabled(c, DirectMessagePreferences.mapRepo.id) &&
            !leaveRepoUnmapped(repo, c);
    });

    if (enabledChatIds.length < 1) {
        return Promise.resolve(Success);
    }

    return Promise.all(enabledChatIds.map(chatId => {
        const id = mapRepoMessageId(repo.owner, repo.name, chatId.screenName);
        return ctx.messageClient.addressUsers(mapRepoMessage(repo, chatId, botName), chatId.screenName, { id });
    }))
        .then(() => Success);
}

/**
 * Create consistent message ID for unmapped repo push updatable message.
 *
 * @param owner org/user that owns repository being linked
 * @param repo name of repository being linked
 * @param screenName chat screen name of person being sent message
 * @return message ID string
 */
export function mapRepoMessageId(owner: string, repo: string, screenName: string): string {
    return `user_message/unmapped_repo/${screenName}/${owner}/${repo}`;
}

/**
 * Extract screen name of user sent message from message ID.
 *
 * @param msgId ID of message
 * @return screen name
 */
export function extractScreenNameFromMapRepoMessageId(msgId: string): string {
    return msgId ? msgId.split("/")[2] : null;
}

function getDisabledRepos(preferences: graphql.PushToUnmappedRepo._Preferences[]): string[] {
    if (!preferences) {
        return [];
    }
    const repoMappingFlow = preferences.find(p => p.name === repoMappingConfigKey);
    if (!repoMappingFlow) {
        return [];
    }
    let mappingConfig: any;
    try {
        mappingConfig = JSON.parse(repoMappingFlow.value);
    } catch (e) {
        const err = (e as Error).message;
        console.error(`failed to parse ${repoMappingConfigKey} value '${repoMappingFlow.value}': ${err}`);
        return [];
    }
    if (!mappingConfig[disabledReposConfigKey]) {
        return [];
    }
    return mappingConfig[disabledReposConfigKey] as string[];
}

export function repoString(repo: graphql.PushToUnmappedRepo.Repo): string {
    if (!repo) {
        return "!";
    }
    const provider = (repo.org && repo.org.provider && repo.org.provider.providerId) ?
        `${repo.org.provider.providerId}:` : "";
    return `${provider}${repo.owner}:${repo.name}`;
}

export function leaveRepoUnmapped(
    repo: graphql.PushToUnmappedRepo.Repo,
    chatId: graphql.PushToUnmappedRepo.ChatId,
): boolean {

    const repoStr = repoString(repo);
    return getDisabledRepos(chatId.preferences).some(r => r === repoStr);
}

export function mapRepoMessage(
    repo: graphql.PushToUnmappedRepo.Repo,
    chatId: graphql.PushToUnmappedRepo.ChatId,
    botName: string,
): slack.SlackMessage {

    const channelName = repoChannelName(repo.name);
    const slug = `${repo.owner}/${repo.name}`;
    const slugText = repoSlackLink(repo);
    const msgId = mapRepoMessageId(repo.owner, repo.name, chatId.screenName);
    botName = botName == null ? DefaultBotName : botName;

    let channelText: string;
    let mapCommand: AssociateRepo | CreateChannel;
    const channel = repo.org.chatTeam.channels.find(c => c.name === channelName);
    if (channel) {
        channelText = slack.channel(channel.channelId);
        mapCommand = new AssociateRepo();
        mapCommand.channelId = channel.channelId;
    } else {
        channelText = slack.bold(`#${channelName}`);
        mapCommand = new CreateChannel();
        mapCommand.channel = channelName;
    }
    mapCommand.apiUrl = (repo.org.provider) ? repo.org.provider.apiUrl : undefined;
    mapCommand.owner = repo.owner;
    mapCommand.repo = repo.name;
    mapCommand.msgId = msgId;

    const mapFallback = `Want to put me to work on ${slug} in #${channelName}?`;
    const mapText = `Want to put me to work on ${slugText} in ${channelText}?`;

    const mapRepoButton = buttonForCommand({ text: "Go ahead", style: "primary" }, mapCommand);
    const mapAttachment: slack.Attachment = {
        pretext: mapText,
        fallback: mapFallback,
        text: "",
        mrkdwn_in: ["pretext"],
        actions: [mapRepoButton],
    };

    const linkRepoCmd = LinkRepo.linkRepoCommand(botName, repo.owner, repo.name);
    const hintText = `or ${slack.codeLine("/invite @" + botName)} me to a relevant channel and type
${slack.codeLine(linkRepoCmd)}`;
    const hintFallback = `or '/invite @${botName}' me to a relevant channel and type\n'${linkRepoCmd}'`;
    const hintAttachment: slack.Attachment = {
        fallback: hintFallback,
        text: hintText,
        mrkdwn_in: ["text"],
    };

    const stopText = `This is the last time I will ask you about ${slack.bold(slug)}. You can stop receiving ` +
        `similar suggestions for all repositories by clicking the button below.`;
    const stopFallback = `This is the last time I will ask you about ${slug}. You can stop receiving ` +
        `similar suggestions for all repositories by clicking the button below.`;
    const stopAllParams = new SetUserPreference();
    stopAllParams.key = "dm";
    stopAllParams.name = `disable_for_${DirectMessagePreferences.mapRepo.id}`;
    stopAllParams.value = "true";
    stopAllParams.label = `${DirectMessagePreferences.mapRepo.id} direct messages disabled`;
    stopAllParams.id = msgId;
    const stopAllButton = buttonForCommand({ text: "All Repositories" }, SetUserPreference, stopAllParams);

    const stopAttachment: slack.Attachment = {
        text: stopText,
        fallback: stopFallback,
        mrkdwn_in: ["text"],
        actions: [stopAllButton],
    };

    const msg: slack.SlackMessage = {
        attachments: [
            mapAttachment,
            hintAttachment,
            stopAttachment,
        ],
    };
    return msg;
}
