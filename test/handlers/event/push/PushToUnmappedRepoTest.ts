import "mocha";
import * as assert from "power-assert";

import { leaveRepoUnmapped, mapRepoMessage } from "../../../../src/handlers/event/push/PushToUnmappedRepo";
// import { PushToUnmappedRepo } from "../../../../src/typings/types";

describe("PushToUnmappedRepo", () => {

    describe("leaveRepoUnmapped", () => {

        const name = "james";
        const owner = "brown";
        const repo = { name, owner };

        it("should handle no preferences", () => {
            assert(leaveRepoUnmapped(repo, {}) === false);
        });

        it("should find the silenced repo", () => {
            const chatId = {
                preferences: [{
                    name: "repo_mapping_flow",
                    value: JSON.stringify({ disabled_repos: [`${owner}/${name}`] }),
                }],
            };
            assert(leaveRepoUnmapped(repo, chatId) === true);
        });

        it("should not find the unmapped repo", () => {
            const chatId = {
                preferences: [{
                    name: "repo_mapping_flow",
                    value: JSON.stringify({ disabled_repos: ["igot/you", "get/up"] }),
                }],
            };
            assert(leaveRepoUnmapped(repo, chatId) === false);
        });

        it("should find the repo among several", () => {
            const chatId = {
                preferences: [{
                    name: "repo_mapping_flow",
                    value: JSON.stringify({ disabled_repos: ["igot/you", `${owner}/${name}`, "get/up"] }),
                }],
            };
            assert(leaveRepoUnmapped(repo, chatId) === true);
        });

    });

    describe("mapRepoMessage", () => {

        it("should send a message offering to create channel and link a repo to it", () => {
            const repo = {
                name: "sin-city",
                owner: "grievous-angel",
                channels: [],
                org: {
                    provider: {
                        apiUrl: "https://ghe.gram-parsons.com/v3/",
                        url: "https://ghe.gram-parsons.com/",
                    },
                    chatTeam: {
                        channels: [
                            {
                                channelId: "C1000WED",
                                name: "1000-wedding",
                            },
                        ],
                    },
                },
            };
            const chatId = {
                screenName: "gram",
                preferences: [{
                    name: "repo_mapping_flow",
                    value: JSON.stringify({}),
                }],
            };
            const repoLink = "<https://ghe.gram-parsons.com/grievous-angel/sin-city|grievous-angel/sin-city>";
            const channelText = "*#sin-city*";
            const msg = mapRepoMessage(repo, chatId);
            assert(msg.attachments.length === 3);
            const linkMsg = msg.attachments[0];
            const hintMsg = msg.attachments[1];
            const stopMsg = msg.attachments[2];
            assert(linkMsg.pretext.indexOf(repoLink) > 0);
            assert(linkMsg.pretext.indexOf(channelText) > 0);
            assert(linkMsg.actions.length === 1);
            assert(linkMsg.actions[0].text === "Go ahead");
            assert(linkMsg.actions[0].type === "button");
            const command = (linkMsg.actions[0] as any).command;
            assert(command.name === "CreateChannel");
            assert(command.parameters.apiUrl === "https://ghe.gram-parsons.com/v3/");
            assert(command.parameters.channel === "sin-city");
            assert(command.parameters.owner === "grievous-angel");
            assert(command.parameters.repo === "sin-city");
            const hintFallBack = `or '/invite @atomist' me to a relevant channel and type
'@atomist repo owner=grievous-angel repo=sin-city'`;
            assert(hintMsg.fallback === hintFallBack);
            const stopText = "Stop receiving similar suggestions for";
            assert(stopMsg.text === stopText);
            assert(stopMsg.fallback === stopText);
            assert(stopMsg.actions.length === 2);
            assert(stopMsg.actions[0].text === "grievous-angel/sin-city");
            assert(stopMsg.actions[0].type === "button");
            const repoStopCmd = (stopMsg.actions[0] as any).command;
            assert(repoStopCmd.name === "SetUserPreference");
            assert(repoStopCmd.parameters.key === "repo_mapping_flow");
            assert(repoStopCmd.parameters.name === "disabled_repos");
            assert(repoStopCmd.parameters.value === `["grievous-angel/sin-city"]`);
            assert(stopMsg.actions[1].text === "All Repos");
            assert(stopMsg.actions[1].type === "button");
            const allStopCmd = (stopMsg.actions[1] as any).command;
            assert(allStopCmd.name === "SetUserPreference");
            assert(allStopCmd.parameters.key === "dm");
            assert(allStopCmd.parameters.name === "disable_for_mapRepo");
            assert(allStopCmd.parameters.value === "true");
        });

        it("should send a message offering to link a repo to existing channel", () => {
            const repo = {
                name: "sin-city",
                owner: "grievous-angel",
                channels: [],
                org: {
                    provider: {
                        apiUrl: "https://ghe.gram-parsons.com/v3/",
                        url: "https://ghe.gram-parsons.com/",
                    },
                    chatTeam: {
                        channels: [
                            {
                                channelId: "C1000WED",
                                name: "1000-wedding",
                            },
                            {
                                channelId: "C51NC1TY",
                                name: "sin-city",
                            },
                        ],
                    },
                },
            };
            const chatId = {
                screenName: "gram",
                preferences: [{
                    name: "repo_mapping_flow",
                    value: JSON.stringify({
                        disabled_repos: [
                            "grievous-angel/a-song-for-you",
                            "grievous-angel/in-my-hour-of-darkness",
                            "grievous-angel/return-of-the-grievous-angel",
                        ],
                    }),
                }],
            };
            const repoLink = "<https://ghe.gram-parsons.com/grievous-angel/sin-city|grievous-angel/sin-city>";
            const channelText = "<#C51NC1TY>";
            const msg = mapRepoMessage(repo, chatId);
            assert(msg.attachments.length === 3);
            const linkMsg = msg.attachments[0];
            const hintMsg = msg.attachments[1];
            const stopMsg = msg.attachments[2];
            assert(linkMsg.pretext.indexOf(repoLink) > 0);
            assert(linkMsg.pretext.indexOf(channelText) > 0);
            assert(linkMsg.actions.length === 1);
            assert(linkMsg.actions[0].text === "Go ahead");
            assert(linkMsg.actions[0].type === "button");
            const command = (linkMsg.actions[0] as any).command;
            assert(command.name === "AssociateRepo");
            assert(command.parameters.apiUrl === "https://ghe.gram-parsons.com/v3/");
            assert(command.parameters.channelId === "C51NC1TY");
            assert(command.parameters.owner === "grievous-angel");
            assert(command.parameters.repo === "sin-city");
            const hintFallBack = `or '/invite @atomist' me to a relevant channel and type
'@atomist repo owner=grievous-angel repo=sin-city'`;
            assert(hintMsg.fallback === hintFallBack);
            const stopText = "Stop receiving similar suggestions for";
            assert(stopMsg.text === stopText);
            assert(stopMsg.fallback === stopText);
            assert(stopMsg.actions.length === 2);
            assert(stopMsg.actions[0].text === "grievous-angel/sin-city");
            assert(stopMsg.actions[0].type === "button");
            const repoStopCmd = (stopMsg.actions[0] as any).command;
            assert(repoStopCmd.name === "SetUserPreference");
            assert(repoStopCmd.parameters.key === "repo_mapping_flow");
            assert(repoStopCmd.parameters.name === "disabled_repos");
            // tslint:disable-next-line:max-line-length
            assert(repoStopCmd.parameters.value === `["grievous-angel/a-song-for-you","grievous-angel/in-my-hour-of-darkness","grievous-angel/return-of-the-grievous-angel","grievous-angel/sin-city"]`);
            assert(stopMsg.actions[1].text === "All Repos");
            assert(stopMsg.actions[1].type === "button");
            const allStopCmd = (stopMsg.actions[1] as any).command;
            assert(allStopCmd.name === "SetUserPreference");
            assert(allStopCmd.parameters.key === "dm");
            assert(allStopCmd.parameters.name === "disable_for_mapRepo");
            assert(allStopCmd.parameters.value === "true");
        });

    });

});
