import { Configuration } from "@atomist/automation-client/configuration";
import * as appRoot from "app-root-path";
import * as cfenv from "cfenv";
import * as config from "config";
import { CloudFoundryApplicationDetail } from "./handlers/command/cloudfoundry/CloudFoundryApplicationDetail";
import { ScaleCloudFoundryApplication } from "./handlers/command/cloudfoundry/ScaleCloudFoundryApplication";
import { StartCloudFoundryApplication } from "./handlers/command/cloudfoundry/StartCloudFoundryApplication";
import { StopCloudFoundryApplication } from "./handlers/command/cloudfoundry/StopCloudFoundryApplication";
import { ApproveGitHubCommit } from "./handlers/command/github/ApproveGitHubCommit";
import { AssignGitHubPullRequestReviewer } from "./handlers/command/github/AssignGitHubPullRequestReviewer";
import { AssignToMeGitHubIssue } from "./handlers/command/github/AssignToMeGitHubIssue";
import { CloseGitHubIssue } from "./handlers/command/github/CloseGitHubIssue";
import { CommentGitHubIssue } from "./handlers/command/github/CommentGitHubIssue";
import { CreateGitHubIssue } from "./handlers/command/github/CreateGitHubIssue";
import { CreateGitHubRelease } from "./handlers/command/github/CreateGitHubRelease";
import { CreateGitHubTag } from "./handlers/command/github/CreateGitHubTag";
import { DeleteGitHubBranch } from "./handlers/command/github/DeleteGitHubBranch";
import { DisplayGitHubIssue } from "./handlers/command/github/DisplayGitHubIssue";
import { EnableGitHubPullRequestAutoMerge } from "./handlers/command/github/EnableGitHubPullRequestAutoMerge";
import { InstallGitHubOrgWebhook, InstallGitHubRepoWebhook } from "./handlers/command/github/InstallGitHubWebhook";
import { ListMyGitHubIssues } from "./handlers/command/github/ListMyGitHubIssues";
import { MergeGitHubPullRequest } from "./handlers/command/github/MergeGitHubPullRequest";
import { RaiseGitHubPullRequest } from "./handlers/command/github/RaiseGitHubPullRequest";
import { ReactGitHubIssue } from "./handlers/command/github/ReactGitHubIssue";
import { ReactGitHubIssueComment } from "./handlers/command/github/ReactGitHubIssueComment";
import { ReopenGitHubIssue } from "./handlers/command/github/ReopenGitHubIssue";
import { SearchGitHubRepositoryIssues } from "./handlers/command/github/SearchGitHubRepositoryIssues";
import { ToggleLabelGitHubIssue } from "./handlers/command/github/ToggleLabelGitHubIssue";
import { RestartTravisBuild } from "./handlers/command/travis/RestartTravisBuild";
import { NotifyPusherOnBuild } from "./handlers/event/build/NotifyPusherOnBuild";
import { CommentToIssueCommentLifecycle } from "./handlers/event/comment/CommentToIssueCommentLifecycle";
import { CommentToPullRequestCommentLifecycle } from "./handlers/event/comment/CommentToPullRequestCommentLifecycle";
import { IssueToIssueCommentLifecycle } from "./handlers/event/comment/IssueToIssueCommentLifecycle";
import { NotifyMentionedOnIssueComment } from "./handlers/event/comment/NotifyMentionedOnIssueComment";
import { NotifyMentionedOnPullRequestComment } from "./handlers/event/comment/NotifyMentionedOnPullRequestComment";
import {
    PullRequestToPullRequestCommentLifecycle,
} from "./handlers/event/comment/PullRequestToPullRequestCommentLifecycle";
import { IssueToIssueLifecycle } from "./handlers/event/issue/IssueToIssueLifecycle";
import { NotifyMentionedOnIssue } from "./handlers/event/issue/NotifyMentionedOnIssue";
import { StatusOnParentImpact } from "./handlers/event/parentimpact/StatusOnParentImpact";
import { AutoMergeOnBuild } from "./handlers/event/pullrequest/AutoMergeOnBuild";
import { AutoMergeOnPullRequest } from "./handlers/event/pullrequest/AutoMergeOnPullRequest";
import { AutoMergeOnReview } from "./handlers/event/pullrequest/AutoMergeOnReview";
import { AutoMergeOnStatus } from "./handlers/event/pullrequest/AutoMergeOnStatus";
import { BranchToPullRequestLifecycle } from "./handlers/event/pullrequest/BranchToPullRequestLifecycle";
import { CommentToPullRequestLifecycle } from "./handlers/event/pullrequest/CommentToPullRequestLifecycle";
import { CommitToPullRequestLifecycle } from "./handlers/event/pullrequest/CommitToPullRequestLifecycle";
import { NotifyMentionedOnPullRequest } from "./handlers/event/pullrequest/NotifyMentionedOnPullRequest";
import { PullRequestToPullRequestLifecycle } from "./handlers/event/pullrequest/PullRequestToPullRequestLifecycle";
import { ReviewToPullRequestLifecycle } from "./handlers/event/pullrequest/ReviewToPullRequestLifecycle";
import { StatusToPullRequestLifecycle } from "./handlers/event/pullrequest/StatusToPullRequestLifecycle";
import { ApplicationToPushLifecycle } from "./handlers/event/push/ApplicationToPushLifecycle";
import { BuildToPushLifecycle } from "./handlers/event/push/BuildToPushLifecycle";
import { IssueToPushLifecycle } from "./handlers/event/push/IssueToPushLifecycle";
import { K8PodToPushLifecycle } from "./handlers/event/push/K8PodToPushLifecycle";
import { ParentImpactToPushLifecycle } from "./handlers/event/push/ParentImpactToPushLifecycle";
import { PushToPushLifecycle } from "./handlers/event/push/PushToPushLifecycle";
import { ReleaseToPushLifecycle } from "./handlers/event/push/ReleaseToPushLifecycle";
import { StatusToPushLifecycle } from "./handlers/event/push/StatusToPushLifecycle";
import { TagToPushLifecycle } from "./handlers/event/push/TagToPushLifecycle";
import { NotifyAuthorOnReview } from "./handlers/event/review/NotifyAuthorOnReview";
import { LogzioAutomationEventListener } from "./util/logzio";

// tslint:disable-next-line:no-var-requires
const pj = require(`${appRoot}/package.json`);

const appEnv = cfenv.getAppEnv();
const credService = appEnv.getServiceCreds("github-token");
const dashboardService = appEnv.getServiceCreds("dashboard-credentials");

const token = credService ? credService.token : process.env.GITHUB_TOKEN;
const username = dashboardService ? dashboardService.user : undefined;
const password = dashboardService ? dashboardService.password : undefined;

const authEnabled = !appEnv.isLocal;

export const configuration: Configuration = {
    name: pj.name,
    version: pj.version,
    teamIds: config.get("teamIds") as string[],
    commands: [
        // cloudfoundry
        () => new CloudFoundryApplicationDetail(),
        () => new ScaleCloudFoundryApplication(),
        () => new StartCloudFoundryApplication(),
        () => new StopCloudFoundryApplication(),

        // github
        () => new ApproveGitHubCommit(),
        () => new AssignGitHubPullRequestReviewer(),
        () => new AssignToMeGitHubIssue(),
        () => new CloseGitHubIssue(),
        () => new CommentGitHubIssue(),
        () => new CreateGitHubIssue(),
        () => new CreateGitHubRelease(),
        () => new CreateGitHubTag(),
        () => new DeleteGitHubBranch(),
        () => new DisplayGitHubIssue(),
        () => new EnableGitHubPullRequestAutoMerge(),
        () => new InstallGitHubOrgWebhook(),
        () => new InstallGitHubRepoWebhook(),
        () => new ListMyGitHubIssues(),
        () => new MergeGitHubPullRequest(),
        () => new RaiseGitHubPullRequest(),
        () => new ReactGitHubIssue(),
        () => new ReactGitHubIssueComment(),
        () => new ReopenGitHubIssue(),
        () => new SearchGitHubRepositoryIssues(),
        () => new ToggleLabelGitHubIssue(),

        // travis
        () => new RestartTravisBuild(),
    ],
    events: [
        // build
        () => new NotifyPusherOnBuild(),

        // parentimpact
        () => new StatusOnParentImpact(),

        // push
        () => new ApplicationToPushLifecycle(),
        () => new BuildToPushLifecycle(),
        () => new IssueToPushLifecycle(),
        () => new K8PodToPushLifecycle(),
        () => new ParentImpactToPushLifecycle(),
        () => new PushToPushLifecycle(),
        () => new ReleaseToPushLifecycle(),
        () => new StatusToPushLifecycle(),
        () => new TagToPushLifecycle(),

        // issue
        () => new IssueToIssueLifecycle(),
        () => new NotifyMentionedOnIssue(),

        // pullRequest
        () => new AutoMergeOnBuild(),
        () => new AutoMergeOnPullRequest(),
        () => new AutoMergeOnReview(),
        () => new AutoMergeOnStatus(),
        () => new BranchToPullRequestLifecycle(),
        () => new CommentToPullRequestLifecycle(),
        () => new CommitToPullRequestLifecycle(),
        () => new NotifyMentionedOnPullRequest(),
        () => new PullRequestToPullRequestLifecycle(),
        () => new ReviewToPullRequestLifecycle(),
        () => new StatusToPullRequestLifecycle(),

        // comment
        () => new CommentToIssueCommentLifecycle(),
        () => new CommentToPullRequestCommentLifecycle(),
        () => new IssueToIssueCommentLifecycle(),
        () => new NotifyMentionedOnIssueComment(),
        () => new NotifyMentionedOnPullRequestComment(),
        () => new PullRequestToPullRequestCommentLifecycle(),

        // review
        () => new NotifyAuthorOnReview(),
        // () => new PullRequestToReviewLifecycle(),
        // () => new ReviewToReviewLifecycle(),
    ],
    listeners: [
        new LogzioAutomationEventListener(),
    ],
    token,
    http: {
        enabled: true,
        auth: {
            basic: {
                enabled: authEnabled,
                username,
                password,
            },
            bearer: {
                enabled: authEnabled,
            },
        },
    },
    endpoints: {
        graphql: config.get("endpoints.graphql"),
        api: config.get("endpoints.api"),
    },
    applicationEvents: {
        enabled: true,
        teamId: "T095SFFBK",
    },
};
