import {
    CommandHandler,
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
import { loadGitHubIdByChatId } from "../../../util/helpers";
import * as github from "./gitHubApi";

/**
 * Approve GitHub status on commit.
 */
@CommandHandler("Approve GitHub status on commit", "approve commit", "approve github commit")
@Tags("fingerprint", "approve")
export class ApproveGitHubCommit implements HandleCommand {

    @MappedParameter(MappedParameters.GitHubRepository)
    public repo: string;

    @MappedParameter(MappedParameters.GitHubOwner)
    public owner: string;

    @Parameter({ description: "comma-separated list of status' to approve", pattern: /^.*$/, required: true })
    public shas: string;

    @Parameter({ description: "target URL of GitHub Status", pattern: /^.*$/, required: false })
    public targetUrl: string;

    @Parameter({ description: "description of GitHub Status", pattern: /^.*$/, required: true })
    public description: string;

    @MappedParameter(MappedParameters.SlackUser)
    public requester: string;

    @MappedParameter(MappedParameters.GitHubApiUrl)
    public apiUrl: string;

    @Secret(Secrets.userToken("repo"))
    public githubToken: string;

    public handle(ctx: HandlerContext): Promise<HandlerResult> {

        return loadGitHubIdByChatId(ctx, this.requester)
            .then(chatId => {
                const api = github.api(this.githubToken, this.apiUrl);
                return Promise.all(this.shas.split(",").map(sha => {
                    return api.repos.createStatus({
                        owner: this.owner,
                        repo: this.repo,
                        sha,
                        state: "success",
                        target_url: this.targetUrl,
                        description: `Approved by ${chatId}: ${this.description}`,
                        context: `fingerprint/atomist`,
                    });
                }));
            })
            .then(() => Success)
            .catch(err => {
                return github.handleError("Approve Commit", err, ctx);
            });
    }
}
