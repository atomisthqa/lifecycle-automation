import {
    AutomationContextAware,
    EventFired,
    HandlerContext,
    HandlerResult,
} from "@atomist/automation-client";
import { CommandInvocation } from "@atomist/automation-client/internal/invoker/Payload";
import {
    CommandIncoming,
    EventIncoming,
} from "@atomist/automation-client/internal/transport/RequestProcessor";
import * as nsp from "@atomist/automation-client/internal/util/cls";
import { AutomationContext } from "@atomist/automation-client/internal/util/cls";
import { logger } from "@atomist/automation-client/internal/util/logger";
import {
    AutomationEventListener,
    AutomationEventListenerSupport,
} from "@atomist/automation-client/server/AutomationEventListener";
import { Destination, MessageOptions } from "@atomist/automation-client/spi/message/MessageClient";
import * as appRoot from "app-root-path";
import * as cluster from "cluster";
import { createLogger } from "logzio-nodejs";
import * as serializeError from "serialize-error";

/* tslint:disable */
const logzioWinstonTransport = require("winston-logzio");
const _assign = require("lodash.assign");
const pj = require(`${appRoot.path}/package.json`);
/* tslint:enable */

export class LogzioAutomationEventListener extends AutomationEventListenerSupport
    implements AutomationEventListener {

    private logzio;

    constructor(options: LogzioOptions) {
        super();
        this.initLogzioLogging(options);
    }

    public commandIncoming(payload: CommandIncoming) {
        this.sendEvent("Incoming command", "request", payload);
    }

    public commandStarting(payload: CommandInvocation,
                           ctx: HandlerContext) {
        this.sendOperation("Command", "operation", "command-handler",
            payload.name, "starting", ctx);
    }

    public commandSuccessful(payload: CommandInvocation,
                             ctx: HandlerContext,
                             result: HandlerResult): Promise<any> {
        this.sendOperation("Command", "operation", "command-handler",
            payload.name, "successful", ctx, result);
        return Promise.resolve();
    }

    public commandFailed(payload: CommandInvocation,
                         ctx: HandlerContext,
                         err: any): Promise<any> {
        this.sendOperation("Command", "operation", "command-handler",
            payload.name, "failed", ctx, err);
        return Promise.resolve();
    }

    public eventIncoming(payload: EventIncoming) {
        this.sendEvent("Incoming event", "event", payload);
    }

    public eventStarting(payload: EventFired<any>,
                         ctx: HandlerContext) {
        this.sendOperation("Event", "operation", "event-handler",
            payload.extensions.operationName, "starting", ctx);
    }

    public eventSuccessful(payload: EventFired<any>,
                           ctx: HandlerContext,
                           result: HandlerResult[]): Promise<any> {
        this.sendOperation("Event", "operation", "event-handler",
            payload.extensions.operationName, "successful", ctx, result);
        return Promise.resolve();
    }

    public eventFailed(payload: EventFired<any>,
                       ctx: HandlerContext, err: any): Promise<any> {
        this.sendOperation("Event", "operation", "event-handler",
            payload.extensions.operationName, "failed", ctx, err);
        return Promise.resolve();
    }

    public messageSent(message: any,
                       destinations: Destination | Destination[],
                       options: MessageOptions, ctx: HandlerContext) {
        this.sendEvent("Outgoing message", "message", {
            message,
            destinations,
            options,
        }, ctx);
    }

    private sendOperation(identifier: string,
                          eventType: string,
                          type: string,
                          name: string,
                          status: string,
                          ctx: HandlerContext,
                          err?: any) {
        const session = getContext(ctx);

        const data: any = {
            "operation-type": type,
            "operation-name": name,
            "artifact": session.name,
            "version": session.version,
            "team-id": session.teamId,
            "team-name": session.teamName,
            "event-type": eventType,
            "level": status === "failed" ? "error" : "info",
            status,
            "execution-time": Date.now() - session.ts,
            "correlation-id": session.correlationId,
            "invocation-id": session.invocationId,
            "message": `${identifier} ${name} invocation ${status} for ${session.teamName} '${session.teamId}'`,
        };
        if (err) {
            if (status === "failed") {
                data.stacktrace = serializeError(err);
            } else if (status === "successful") {
                data.result = serializeError(err);
            }
        }
        if (this.logzio) {
            this.logzio.log(data);
        }
    }

    private sendEvent(identifier: string,
                      type: string,
                      payload: any,
                      ctx?: HandlerContext) {

        const session = getContext(ctx);

        const data = {
            "operation-name": session.operation,
            "artifact": session.name,
            "version": session.version,
            "team-id": session.teamId,
            "team-name": session.teamName,
            "event-type": type,
            "level": "info",
            "correlation-id": session.correlationId,
            "invocation-id": session.invocationId,
            "message": `${identifier} of ${session.operation} for ${session.teamName} '${session.teamId}'`,
            "payload": JSON.stringify(payload),
        };
        if (this.logzio) {
            this.logzio.log(data);
        }
    }

    private initLogzioLogging(options: LogzioOptions) {

        const logzioOptions = {
            token: options.token,
            level: "debug",
            type: "automation-client",
            protocol: "https",
            bufferSize: 10,
            extraFields: {
                "service": pj.name,
                "artifact": pj.name,
                "version": pj.version,
                "environment": options.environmentId,
                "application-id": options.applicationId,
                "process-id": process.pid,
                "cluster-role": cluster.isMaster ? "master" : "worker",
            },
        };
        // create the logzio event logger
        this.logzio = createLogger(logzioOptions);

        logzioWinstonTransport.prototype.log = function(level, msg, meta, callback) {

            if (typeof msg !== "string" && typeof msg !== "object") {
                msg = { message: this.safeToString(msg) };
            } else if (typeof msg === "string") {
                msg = { message: msg };
            }

            if (meta instanceof Error) {
                meta = { error: meta.stack || meta.toString() };
            }

            if (nsp && nsp.get()) {
                _assign(msg, {
                    level,
                    "meta": meta,
                    "operation-name": nsp.get().operation,
                    "artifact": nsp.get().name,
                    "version": nsp.get().version,
                    "team-id": nsp.get().teamId,
                    "team-name": nsp.get().teamName,
                    "correlation-id": nsp.get().correlationId,
                    "invocation-id": nsp.get().invocationId,
                });
            } else {
                _assign(msg, {
                    level,
                    meta,
                });
            }

            this.logzioLogger.log(msg);

            callback(null, true);
        };

        // create the winston logging adapter
        (logger as any).add(logzioWinstonTransport, logzioOptions);

    }
}

export interface LogzioOptions {

    token: string;
    environmentId: string;
    applicationId: string;

}

function getContext(ctx: HandlerContext) {
    let session: AutomationContext;
    if (ctx && (ctx as any).context) {
        session = (ctx as any as AutomationContextAware).context;
    } else {
        session = nsp.get();
    }
    return session;
}
