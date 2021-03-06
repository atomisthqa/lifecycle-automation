import {
    failure,
    HandlerContext,
    HandlerResult,
    Success,
} from "@atomist/automation-client";
import { HandlerError } from "@atomist/automation-client/HandlerResult";
import * as GitHubApi from "github";
import * as URL from "url";
import { error } from "../../../util/messages";

export const DefaultGitHubApiUrl = "https://api.github.com/";

export function api(token: string, apiUrl: string = DefaultGitHubApiUrl): GitHubApi {
    // separate the url
    const url = URL.parse(apiUrl);

    const gitHubApi = new GitHubApi({
        host: url.hostname,
        pathPrefix: url.pathname,
        protocol: url.protocol.slice(0, -1),
        port: +url.port,
    });

    gitHubApi.authenticate({ type: "token", token });
    return gitHubApi;
}

export function handleError(title: string, err: any, ctx: HandlerContext): Promise<HandlerResult> | HandlerError {
    if (err.message) {
        const body = JSON.parse(err.message);
        const message = body.message ? `${body.message}.` : "Error occurred. Please contact support.";
        return ctx.messageClient.respond(error(title, message, ctx))
            .then(() => Success, failure);
    }
    return failure(err);
}
