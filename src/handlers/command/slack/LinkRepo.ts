import {
    CommandHandler,
    failure,
    HandleCommand,
    HandlerContext,
    HandlerResult,
    MappedParameter,
    MappedParameters,
    Parameter,
    Secret,
    Secrets,
    Success,
    Tags,
} from "@atomist/automation-client";
import * as slack from "@atomist/slack-messages/SlackMessages";
import * as _ from "lodash";

import { LinkSlackChannelToRepo } from "../../../typings/types";
import * as graphql from "../../../typings/types";
import { isChannel } from "../../../util/slack";
import {
    checkRepo,
    noRepoMessage,
} from "./AssociateRepo";

export const DefaultBotName = "atomist";

export function linkSlackChannelToRepo(
    ctx: HandlerContext,
    teamId: string,
    channelId: string,
    repo: string,
    owner: string,
    providerId: string,
): Promise<LinkSlackChannelToRepo.Mutation> {

    return ctx.graphClient.executeMutationFromFile<LinkSlackChannelToRepo.Mutation, LinkSlackChannelToRepo.Variables>(
        "../../../graphql/mutation/linkSlackChannelToRepo",
        { teamId, channelId, repo, owner, providerId },
        {},
        __dirname,
    );
}

@CommandHandler("Link a repository and channel", "repo", "link repo", "link repository")
@Tags("slack", "repo")
export class LinkRepo implements HandleCommand {

    public static linkRepoCommand(
        botName: string = DefaultBotName,
        owner: string = "OWNER",
        repo: string = "REPO",
    ): string {

        return `@${botName} repo owner=${owner} name=${repo}`;
    }

    @MappedParameter(MappedParameters.SlackTeam)
    public teamId: string;

    @MappedParameter(MappedParameters.SlackChannel)
    public channelId: string;

    @MappedParameter(MappedParameters.SlackChannelName)
    public channelName: string;

    @MappedParameter(MappedParameters.GitHubOwnerWithUser)
    public owner: string;

    @MappedParameter(MappedParameters.GitHubApiUrl)
    public apiUrl: string;

    @Secret(Secrets.userToken("repo"))
    public githubToken: string;

    @Parameter({
        displayName: "Repository Name",
        description: "name of the repository to link",
        pattern: /^[-.\w]+$/,
        minLength: 1,
        maxLength: 100,
        required: true,
    })
    public name: string;

    @Parameter({ pattern: /^\S*$/, displayable: false, required: false })
    public msgId: string;

    @Parameter({ pattern: /^[\S\s]*$/, displayable: false, required: false })
    public msg: string = "";

    public handle(ctx: HandlerContext): Promise<HandlerResult> {
        if (!isChannel(this.channelId)) {
            const err = "The Atomist Bot can only link repositories to public or private channels. " +
                "Please try again in a public or private channel.";
            return ctx.messageClient.addressChannels(err, this.channelName)
                .then(() => Success, failure);
        }
        return checkRepo(this.githubToken, this.apiUrl, this.name, this.owner)
            .then(repoExists => {
                if (!repoExists) {
                    return ctx.messageClient.respond(noRepoMessage(this.name, this.owner, ctx));
                }
                return ctx.graphClient.executeQueryFromFile<graphql.ProviderIdFromOrg.Query,
                    graphql.ProviderIdFromOrg.Variables>(
                    "../../../graphql/query/providerIdFromOrg",
                    { owner: this.owner },
                    {},
                    __dirname)
                    .then(result => {
                        const providerId = _.get(result, "Org[0].provider.providerId");
                        return linkSlackChannelToRepo(
                            ctx, this.teamId, this.channelId, this.name, this.owner, providerId)
                            .then(() => {
                                if (this.msgId) {
                                    return ctx.messageClient.addressChannels(
                                        this.msg, this.channelName, { id: this.msgId });
                                }
                                return Success;
                            });
                    });
            })
            .then(() => Success, failure);
    }

}
