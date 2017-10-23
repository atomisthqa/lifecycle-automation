import { CommandHandler, MappedParameter, Tags } from "@atomist/automation-client/decorators";
import { HandleCommand } from "@atomist/automation-client/HandleCommand";
import { HandlerContext } from "@atomist/automation-client/HandlerContext";
import { HandlerResult, Success } from "@atomist/automation-client/HandlerResult";
import { MappedParameters } from "@atomist/automation-client/Handlers";
import { logger } from "@atomist/automation-client/internal/util/logger";
import { codeBlock, url } from "@atomist/slack-messages/SlackMessages";
import * as appRoot from "app-root-path";
import * as fs from "fs";
import * as os from "os";

let DataDirectory = null;

export function initMemoryMonitoring(dataDirectory: string = `${appRoot.path}/heap`) {

    logger.info("Initialising memory monitoring");
    DataDirectory = dataDirectory;
    if (!fs.existsSync(DataDirectory)) {
        fs.mkdirSync(DataDirectory);
    }

    setInterval(() => {
        logger.debug("Memory stats: %j", memoryUsage());
    }, 60000);
}

export function heapDump(): string {
    logger.debug("Memory stats for pid '%s': %j", process.pid, process.memoryUsage());
    const heapdump = require("heapdump");
    const name = `heapdump-${Date.now()}.heapsnapshot`;
    heapdump.writeSnapshot(`${DataDirectory}/${name}`, (err, filename) => {
        logger.debug("Heap dump written to '%s'", filename);
    });
    return name;
}

export function memoryUsage() {
    const usage = {
        ...process.memoryUsage(),
        freemem: os.freemem(),
        totalmem: os.totalmem(),
    };
    return usage;
}

export function gc() {
    if (global.gc) {
        global.gc();
    }
}

@CommandHandler("Trigger heap dump and GC", "lifecycle heap")
@Tags("memory", "gc", "dump")
export class HeapDumpCommand implements HandleCommand {

    @MappedParameter(MappedParameters.SlackUser)
    public slackUser: string;

    public handle(ctx: HandlerContext): Promise<HandlerResult> {
        if (this.slackUser === "U095T3BPF" || this.slackUser === "U1L22E3SA") {

            const name = heapDump();
            gc();

            return ctx.messageClient
                .addressUsers(`Thread dump available at ${url("https://lifecycle.atomist.com/heap/" + name,
                    name)}`, "cd")
                .then(() => ({code: 0, filename: name}));
        } else {
            return Promise.resolve(Success);
        }
    }
}

@CommandHandler("Get memory usage", "lifecycle stats")
@Tags("memory", "usage")
export class MemoryUsageCommand implements HandleCommand {

    @MappedParameter(MappedParameters.SlackUser)
    public slackUser: string;

    public handle(ctx: HandlerContext): Promise<HandlerResult> {
        if (this.slackUser === "U095T3BPF" || this.slackUser === "U1L22E3SA") {
            return ctx.messageClient
                .addressUsers(codeBlock(JSON.stringify(memoryUsage(), null, 2)), "cd")
                .then(() => ({ code: 0, ...memoryUsage() }));
        } else {
            return Promise.resolve(Success);
        }
    }
}