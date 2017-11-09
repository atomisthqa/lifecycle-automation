import * as yaml from "js-yaml";
import * as _ from "lodash";
import * as graphql from "../../../../typings/types";
import { WorkflowStage } from "./WorkflowStage";

export function circleWorkflowtoStages(workflow: graphql.PushToPushLifecycle.Workflow): WorkflowStage[] {

    const doc = yaml.load(workflow.config);
    const jobsConfig = _.find(_.values(doc.workflows), v => v.jobs).jobs;
    const stages: Stage[] = [];
    jobsConfig.forEach(jc => {
        const name = _.head(_.keys(jc));
        if (jc[name].requires) {
            let stage = _.find(stages, j => _.isEqual(j.require, jc[name].requires));
            if (!stage) {
                stage = {
                    jobs: [name],
                    require: jc[name].requires,
                };
                stages.push(stage);
            } else {
                stage.jobs.push(name);
            }
        }
    });

    const orderedStages: Stage[] = [{
        jobs: ["build"],
        require: [],
    }];
    const visitedJobs = ["build"];

    while (orderedStages.length <= stages.length) {
        const remainingStages: Stage[] = _.clone(stages);
        _.remove(remainingStages, s => _.includes(orderedStages, s));
        const stagesRequireOnlyVisitedJobs: Stage[] = remainingStages.
            filter(s => _.every(s.require, r => _.includes(visitedJobs, r)));
        const newlyVisitedJobs: string[] = _.uniq(_.flatMap(stagesRequireOnlyVisitedJobs, s => s.jobs));
        newlyVisitedJobs.forEach(j => visitedJobs.push(j));
        stagesRequireOnlyVisitedJobs.forEach(s => orderedStages.push(s));
    }

    const workflowStages: WorkflowStage[] = _.map(orderedStages, s => {
        const buildsInStage = workflow.builds.filter(b => _.includes(s.jobs, b.jobName));
        let jobName = s.jobs[0];
        if (buildsInStage.length === 0) {
            return { name: jobName } as WorkflowStage;
        }
        let longestJobDuration = 0;
        let earliestStart;
        let latestEnd = 0;
        let isFailure = false;
        buildsInStage.forEach(b => {
            const startedAt = Date.parse(b.startedAt);
            const finishedAt = Date.parse(b.finishedAt);
            earliestStart = _.min([earliestStart, startedAt]);
            latestEnd = _.max([latestEnd, finishedAt]);
            const jobDuration = finishedAt - startedAt;
            if (b.status === "failed") {
                isFailure = true;
                jobName = b.jobName;
            }
            if (longestJobDuration < jobDuration) {
                longestJobDuration = jobDuration;
                if (!isFailure) {
                    jobName = b.jobName;
                }
            }
        });
        return {
            name: jobName,
            completed: {
                status: isFailure ? "failed" : "passed",
                totalDuration: latestEnd - earliestStart,
                longestJobDuration,
            },
        } as WorkflowStage;
    });
    // add times and statuses based on build events
    return workflowStages;
}

interface Stage {
    jobs: string[];
    require: string[];
}