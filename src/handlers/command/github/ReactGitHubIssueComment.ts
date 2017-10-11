import {
    CommandHandler,
    MappedParameter,
    Parameter,
    Secret,
    Tags,
} from "@atomist/automation-client/decorators";
import {
    HandleCommand,
    HandlerContext,
    HandlerResult,
    MappedParameters,
    Secrets,
    Success,
} from "@atomist/automation-client/Handlers";
import * as github from "./gitHubApi";

@CommandHandler("React to a GitHub comment", "react issue comment")
@Tags("github", "comment", "reaction")
export class ReactGitHubIssueComment implements HandleCommand {

    @Parameter({ description: "The reaction to add", pattern: /^\+1|-1|laugh|confused|heart|hooray$/ })
    public reaction: "+1" | "-1" | "laugh" | "confused" | "heart" | "hooray";

    @Parameter({ description: "The comment number", pattern: /^.*$/ })
    public comment: string;

    @MappedParameter(MappedParameters.GitHubRepository)
    public repo: string;

    @MappedParameter(MappedParameters.GitHubOwner)
    public owner: string;

    @MappedParameter(MappedParameters.GitHubApiUrl)
    public apiUrl: string = "https://api.github.com/";

    @Secret(Secrets.userToken(["repo"]))
    public githubToken: string;

    public handle(ctx: HandlerContext): Promise<HandlerResult> {
        return github.api(this.githubToken, this.apiUrl).reactions.createForIssueComment({
            owner: this.owner,
            repo: this.repo,
            id: this.comment,
            content: this.reaction,
        })
            .then(() => Success)
            .catch(err => ({ code: 1, message: err.message, stack: err.stack }));
    }
}
