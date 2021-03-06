import { EventFired } from "@atomist/automation-client/HandleEvent";
import "mocha";
import * as assert from "power-assert";
import { K8PodNodeRenderer } from "../../../../../src/handlers/event/push/rendering/PushNodeRenderers";
import * as graphql from "../../../../../src/typings/types";

describe("K8PodNodeRenderer", () => {

    /* tslint:disable */
    const noImages = `{
  "data": {
    "Status": [
      {
        "commit": {
          "pushes": [
            {
              "builds": [
                {
                  "buildId": "55689928",
                  "buildUrl": "https://travis-ci.com/atomisthq/rug-runner/builds/55689928",
                  "name": "1166",
                  "provider": "travis",
                  "status": "passed",
                  "commit": {
                    "sha": "1f5236e8dd9da0b5f7f8af06dec9c07fa51a65f5"
                  },
                  "timestamp": "2017-09-28T17:58:45.247Z"
                }
              ],
              "before": {
                "sha": "637f465bd44d6992482574f33415288fbd5a9692"
              },
              "after": {
                "sha": "1f5236e8dd9da0b5f7f8af06dec9c07fa51a65f5",
                "message": "Update README.md",
                "statuses": [
                  {
                    "context": "continuous-integration/travis-ci/push",
                    "description": "The Travis CI build passed",
                    "targetUrl": "https://travis-ci.com/atomisthq/rug-runner/builds/55689928?utm_source=github_status&utm_medium=notification",
                    "state": "success"
                  },
                  {
                    "context": "fingerprint/atomist",
                    "description": "No blocking Fingerprint changes",
                    "targetUrl": "",
                    "state": "success"
                  }
                ],
                "tags": [
                  {
                    "name": "2.2.0-20170928175629+travis1166"
                  },
                  {
                    "name": "2.2.0-20170928175629"
                  }
                ]
              },
              "repo": {
                "owner": "atomisthq",
                "name": "rug-runner",
                "channels": [
                  {
                    "name": "rug-runner"
                  }
                ],
                "labels": [
                  {
                    "name": "bug"
                  },
                  {
                    "name": "enhancement"
                  }
                ],
                "org": {
                  "provider": null
                },
                "defaultBranch": "master"
              },
              "commits": [
                {
                  "sha": "1f5236e8dd9da0b5f7f8af06dec9c07fa51a65f5",
                  "message": "Update README.md",
                  "resolves": [],
                  "impact": {
                    "data": "[[[\\"travis\\",0],[\\"docker\\",0],[\\"props\\",0],[\\"rest\\",0],[\\"plugsMgt\\",0],[\\"depsMgt\\",0],[\\"plugins\\",0],[\\"deps\\",0]]]",
                    "url": ""
                  },
                  "apps": [],
                  "tags": [
                    {
                      "name": "2.2.0-20170928175629+travis1166",
                      "release": null,
                      "containers": []
                    },
                    {
                      "name": "2.2.0-20170928175629",
                      "release": null,
                      "containers": []
                    }
                  ],
                  "author": {
                    "login": "cdupuis",
                    "person": {
                      "chatId": {
                        "screenName": "cd"
                      }
                    }
                  },
                  "timestamp": "2017-09-28T19:53:38+02:00"
                }
              ],
              "timestamp": "2017-09-28T17:53:39.382Z",
              "branch": "master"
            }
          ],
          "timestamp": "2017-09-28T19:53:38+02:00"
        }
      }
    ]
  },
  "extensions": {
    "type": "READ_ONLY",
    "operationName": "StatusToPushLifecycle",
    "team_id": "T095SFFBK",
    "correlation_id": "d6e489ed-c251-4318-9f18-af6d68a11c97"
  }
}`;
    /* tslint:enable */

    it("no images attachement", () => {
        const event = JSON.parse(noImages) as EventFired<graphql.StatusToPushLifecycle.Subscription>;
        const status = event.data.Status[0];
        const push = status.commit.pushes[0];
        const renderer = new K8PodNodeRenderer();
        assert(!renderer.supports(push));
    });

    /* tslint:disable */
    const singleImageWithRunningContainer = `{
  "data": {
    "Status": [
      {
        "commit": {
          "pushes": [
            {
              "builds": [
                {
                  "buildId": "55689928",
                  "buildUrl": "https://travis-ci.com/atomisthq/rug-runner/builds/55689928",
                  "name": "1166",
                  "provider": "travis",
                  "status": "passed",
                  "commit": {
                    "sha": "1f5236e8dd9da0b5f7f8af06dec9c07fa51a65f5"
                  },
                  "timestamp": "2017-09-28T17:58:45.247Z"
                }
              ],
              "before": {
                "sha": "637f465bd44d6992482574f33415288fbd5a9692"
              },
              "after": {
                "sha": "1f5236e8dd9da0b5f7f8af06dec9c07fa51a65f5",
                "message": "Update README.md",
                "statuses": [
                  {
                    "context": "continuous-integration/travis-ci/push",
                    "description": "The Travis CI build passed",
                    "targetUrl": "https://travis-ci.com/atomisthq/rug-runner/builds/55689928?utm_source=github_status&utm_medium=notification",
                    "state": "success"
                  },
                  {
                    "context": "fingerprint/atomist",
                    "description": "No blocking Fingerprint changes",
                    "targetUrl": "",
                    "state": "success"
                  }
                ],
                "tags": [
                  {
                    "name": "2.2.0-20170928175629+travis1166"
                  },
                  {
                    "name": "2.2.0-20170928175629"
                  }
                ],
                "images": [
                    {
                      "_id": 123,
                      "image": null,
                      "imageName": "sforzando-dockerv2-local.jfrog.io/srv1:0.1.0",
                      "pods": [
                        {
                          "_id": 456,
                          "baseName": "srv1",
                          "name": "srv1-asdf",
                          "resourceVersion": 42,
                          "phase": "Deleted",
                          "containers": [
                            {
                              "_id": 789,
                              "ready": true,
                              "name": "srv1",
                              "restartCount": 0,
                              "resourceVersion": 111,
                              "state": "running",
                              "environment": "prod",
                              "imageName": "sforzando-dockerv2-local.jfrog.io/srv1:0.1.0",
                              "timestamp": "2018-01-16T11:39:36.842Z"
                            }
                          ],
                          "environment": "prod",
                          "timestamp": "2018-01-16T11:39:57Z",
                          "namespace": ""
                        }
                      ]
                    }
                ]
              },
              "repo": {
                "owner": "atomisthq",
                "name": "rug-runner",
                "channels": [
                  {
                    "name": "rug-runner"
                  }
                ],
                "labels": [
                  {
                    "name": "bug"
                  },
                  {
                    "name": "enhancement"
                  }
                ],
                "org": {
                  "provider": null
                },
                "defaultBranch": "master"
              },
              "commits": [
                {
                  "sha": "1f5236e8dd9da0b5f7f8af06dec9c07fa51a65f5",
                  "message": "Update README.md",
                  "resolves": [],
                  "impact": {
                    "data": "[[[\\"travis\\",0],[\\"docker\\",0],[\\"props\\",0],[\\"rest\\",0],[\\"plugsMgt\\",0],[\\"depsMgt\\",0],[\\"plugins\\",0],[\\"deps\\",0]]]",
                    "url": ""
                  },
                  "apps": [],
                  "tags": [
                    {
                      "name": "2.2.0-20170928175629+travis1166",
                      "release": null,
                      "containers": []
                    },
                    {
                      "name": "2.2.0-20170928175629",
                      "release": null,
                      "containers": []
                    }
                  ],
                  "author": {
                    "login": "cdupuis",
                    "person": {
                      "chatId": {
                        "screenName": "cd"
                      }
                    }
                  },
                  "timestamp": "2017-09-28T19:53:38+02:00"
                }
              ],
              "timestamp": "2017-09-28T17:53:39.382Z",
              "branch": "master"
            }
          ],
          "timestamp": "2017-09-28T19:53:38+02:00"
        }
      }
    ]
  },
  "extensions": {
    "type": "READ_ONLY",
    "operationName": "StatusToPushLifecycle",
    "team_id": "T095SFFBK",
    "correlation_id": "d6e489ed-c251-4318-9f18-af6d68a11c97"
  }
}`;
    /* tslint:enable */

    it("should render single image with one running container", done => {
        const event = JSON.parse(singleImageWithRunningContainer)as
            EventFired<graphql.StatusToPushLifecycle.Subscription>;
        const status = event.data.Status[0];
        const push = status.commit.pushes[0];
        const renderer = new K8PodNodeRenderer();
        renderer.render(push, [], {attachments: []}, undefined).then(msg => {
            const expected = [
                {
                    actions: [],
                    author_icon: "https://images.atomist.com/rug/kubes.png",
                    author_name: "Containers",
                    fallback: "prod - 1 running",
                    footer: "sforzando-dockerv2-local.jfrog.io/srv1:0.1.0",
                    mrkdwn_in: [
                        "text",
                    ],
                    text: "`prod` 1 running",
                },
            ];
            assert.deepEqual(msg.attachments, expected);
        })
        .then(done, done);
    });

    /* tslint:disable */
    const singleImageWithManyContainers = `{
  "data": {
    "Status": [
      {
        "commit": {
          "pushes": [
            {
              "builds": [
                {
                  "buildId": "55689928",
                  "buildUrl": "https://travis-ci.com/atomisthq/rug-runner/builds/55689928",
                  "name": "1166",
                  "provider": "travis",
                  "status": "passed",
                  "commit": {
                    "sha": "1f5236e8dd9da0b5f7f8af06dec9c07fa51a65f5"
                  },
                  "timestamp": "2017-09-28T17:58:45.247Z"
                }
              ],
              "before": {
                "sha": "637f465bd44d6992482574f33415288fbd5a9692"
              },
              "after": {
                "sha": "1f5236e8dd9da0b5f7f8af06dec9c07fa51a65f5",
                "message": "Update README.md",
                "statuses": [
                  {
                    "context": "continuous-integration/travis-ci/push",
                    "description": "The Travis CI build passed",
                    "targetUrl": "https://travis-ci.com/atomisthq/rug-runner/builds/55689928?utm_source=github_status&utm_medium=notification",
                    "state": "success"
                  },
                  {
                    "context": "fingerprint/atomist",
                    "description": "No blocking Fingerprint changes",
                    "targetUrl": "",
                    "state": "success"
                  }
                ],
                "tags": [
                  {
                    "name": "2.2.0-20170928175629+travis1166"
                  },
                  {
                    "name": "2.2.0-20170928175629"
                  }
                ],
                "images": [
                    {
                      "_id": 123,
                      "image": null,
                      "imageName": "sforzando-dockerv2-local.jfrog.io/srv1:0.1.0",
                      "pods": [
                        {
                          "_id": 456,
                          "baseName": "srv1",
                          "name": "srv1-asdf",
                          "resourceVersion": 42,
                          "phase": "Deleted",
                          "containers": [
                            {
                              "_id": 789,
                              "ready": true,
                              "name": "srv1",
                              "restartCount": 0,
                              "resourceVersion": 111,
                              "state": "waiting",
                              "environment": "prod",
                              "imageName": "sforzando-dockerv2-local.jfrog.io/srv1:0.1.0",
                              "timestamp": "2018-01-16T11:39:36.842Z"
                            },
                            {
                              "_id": 789,
                              "ready": true,
                              "name": "srv1",
                              "restartCount": 0,
                              "resourceVersion": 111,
                              "state": "waiting",
                              "environment": "prod",
                              "imageName": "sforzando-dockerv2-local.jfrog.io/srv1:0.1.0",
                              "timestamp": "2018-01-16T11:39:36.842Z"
                            },
                            {
                              "_id": 789,
                              "ready": true,
                              "name": "srv1",
                              "restartCount": 0,
                              "resourceVersion": 111,
                              "state": "terminated",
                              "environment": "prod",
                              "imageName": "sforzando-dockerv2-local.jfrog.io/srv1:0.1.0",
                              "timestamp": "2018-01-16T11:39:36.842Z"
                            },
                            {
                              "_id": 789,
                              "ready": true,
                              "name": "srv1",
                              "restartCount": 0,
                              "resourceVersion": 111,
                              "state": "terminated",
                              "environment": "prod",
                              "imageName": "sforzando-dockerv2-local.jfrog.io/srv1:0.1.0",
                              "timestamp": "2018-01-16T11:39:36.842Z"
                            },
                            {
                              "_id": 789,
                              "ready": true,
                              "name": "srv1",
                              "restartCount": 0,
                              "resourceVersion": 111,
                              "state": "terminated",
                              "environment": "prod",
                              "imageName": "sforzando-dockerv2-local.jfrog.io/srv1:0.1.0",
                              "timestamp": "2018-01-16T11:39:36.842Z"
                            }
                          ],
                          "environment": "prod",
                          "timestamp": "2018-01-16T11:39:57Z",
                          "namespace": ""
                        },
                        {
                          "_id": 456,
                          "baseName": "srv1",
                          "name": "srv1-asdf",
                          "resourceVersion": 42,
                          "phase": "Deleted",
                          "containers": [
                          ],
                          "environment": "staging",
                          "timestamp": "2018-01-16T11:39:57Z",
                          "namespace": ""
                        }
                      ]
                    }
                ]
              },
              "repo": {
                "owner": "atomisthq",
                "name": "rug-runner",
                "channels": [
                  {
                    "name": "rug-runner"
                  }
                ],
                "labels": [
                  {
                    "name": "bug"
                  },
                  {
                    "name": "enhancement"
                  }
                ],
                "org": {
                  "provider": null
                },
                "defaultBranch": "master"
              },
              "commits": [
                {
                  "sha": "1f5236e8dd9da0b5f7f8af06dec9c07fa51a65f5",
                  "message": "Update README.md",
                  "resolves": [],
                  "impact": {
                    "data": "[[[\\"travis\\",0],[\\"docker\\",0],[\\"props\\",0],[\\"rest\\",0],[\\"plugsMgt\\",0],[\\"depsMgt\\",0],[\\"plugins\\",0],[\\"deps\\",0]]]",
                    "url": ""
                  },
                  "apps": [],
                  "tags": [
                    {
                      "name": "2.2.0-20170928175629+travis1166",
                      "release": null,
                      "containers": []
                    },
                    {
                      "name": "2.2.0-20170928175629",
                      "release": null,
                      "containers": []
                    }
                  ],
                  "author": {
                    "login": "cdupuis",
                    "person": {
                      "chatId": {
                        "screenName": "cd"
                      }
                    }
                  },
                  "timestamp": "2017-09-28T19:53:38+02:00"
                }
              ],
              "timestamp": "2017-09-28T17:53:39.382Z",
              "branch": "master"
            }
          ],
          "timestamp": "2017-09-28T19:53:38+02:00"
        }
      }
    ]
  },
  "extensions": {
    "type": "READ_ONLY",
    "operationName": "StatusToPushLifecycle",
    "team_id": "T095SFFBK",
    "correlation_id": "d6e489ed-c251-4318-9f18-af6d68a11c97"
  }
}`;
    /* tslint:enable */

    it("should render single image with many containers", done => {
        const event = JSON.parse(singleImageWithManyContainers) as
            EventFired<graphql.StatusToPushLifecycle.Subscription>;
        const status = event.data.Status[0];
        const push = status.commit.pushes[0];
        const renderer = new K8PodNodeRenderer();
        renderer.render(push, [], {attachments: []}, undefined).then(msg => {
            const expected = [
                {
                    actions: [],
                    author_icon: "https://images.atomist.com/rug/kubes.png",
                    author_name: "Containers",
                    fallback: "prod - 0 running, 2 waiting, 3 terminated",
                    footer: "sforzando-dockerv2-local.jfrog.io/srv1:0.1.0",
                    mrkdwn_in: [
                        "text",
                    ],
                    text: "`prod` 0 running, 2 waiting, 3 terminated",
                },
                {
                    actions: [],
                    fallback: "staging - 0 running",
                    footer: "sforzando-dockerv2-local.jfrog.io/srv1:0.1.0",
                    mrkdwn_in: [
                        "text",
                    ],
                    text: "`staging` 0 running",
                },
            ];
            assert.deepEqual(msg.attachments, expected);
        })
            .then(done, done);
    });

    /* tslint:disable */
    const multipleImages = `{
  "data": {
    "Status": [
      {
        "commit": {
          "pushes": [
            {
              "builds": [
                {
                  "buildId": "55689928",
                  "buildUrl": "https://travis-ci.com/atomisthq/rug-runner/builds/55689928",
                  "name": "1166",
                  "provider": "travis",
                  "status": "passed",
                  "commit": {
                    "sha": "1f5236e8dd9da0b5f7f8af06dec9c07fa51a65f5"
                  },
                  "timestamp": "2017-09-28T17:58:45.247Z"
                }
              ],
              "before": {
                "sha": "637f465bd44d6992482574f33415288fbd5a9692"
              },
              "after": {
                "sha": "1f5236e8dd9da0b5f7f8af06dec9c07fa51a65f5",
                "message": "Update README.md",
                "statuses": [
                  {
                    "context": "continuous-integration/travis-ci/push",
                    "description": "The Travis CI build passed",
                    "targetUrl": "https://travis-ci.com/atomisthq/rug-runner/builds/55689928?utm_source=github_status&utm_medium=notification",
                    "state": "success"
                  },
                  {
                    "context": "fingerprint/atomist",
                    "description": "No blocking Fingerprint changes",
                    "targetUrl": "",
                    "state": "success"
                  }
                ],
                "tags": [
                  {
                    "name": "2.2.0-20170928175629+travis1166"
                  },
                  {
                    "name": "2.2.0-20170928175629"
                  }
                ],
                "images": [
                    {
                      "_id": 123,
                      "image": null,
                      "imageName": "sforzando-dockerv2-local.jfrog.io/srv1:0.1.0",
                      "pods": [
                        {
                          "_id": 456,
                          "baseName": "srv1",
                          "name": "srv1-asdf",
                          "resourceVersion": 42,
                          "phase": "Deleted",
                          "containers": [
                            {
                              "_id": 789,
                              "ready": true,
                              "name": "srv1",
                              "restartCount": 0,
                              "resourceVersion": 111,
                              "state": "running",
                              "environment": "prod",
                              "imageName": "sforzando-dockerv2-local.jfrog.io/srv1:0.1.0",
                              "timestamp": "2018-01-16T11:39:36.842Z"
                            }
                          ],
                          "environment": "prod",
                          "timestamp": "2018-01-16T11:39:57Z",
                          "namespace": ""
                        }
                      ]
                    },
                    {
                      "_id": 1234,
                      "image": null,
                      "imageName": "sforzando-dockerv2-local.jfrog.io/srv1:0.2.0",
                      "pods": [
                        {
                          "_id": 456,
                          "baseName": "srv1",
                          "name": "srv1-asdf",
                          "resourceVersion": 42,
                          "phase": "Deleted",
                          "containers": [
                          ],
                          "environment": "prod",
                          "timestamp": "2018-01-16T11:39:57Z",
                          "namespace": ""
                        }
                      ]
                    }
                ]
              },
              "repo": {
                "owner": "atomisthq",
                "name": "rug-runner",
                "channels": [
                  {
                    "name": "rug-runner"
                  }
                ],
                "labels": [
                  {
                    "name": "bug"
                  },
                  {
                    "name": "enhancement"
                  }
                ],
                "org": {
                  "provider": null
                },
                "defaultBranch": "master"
              },
              "commits": [
                {
                  "sha": "1f5236e8dd9da0b5f7f8af06dec9c07fa51a65f5",
                  "message": "Update README.md",
                  "resolves": [],
                  "impact": {
                    "data": "[[[\\"travis\\",0],[\\"docker\\",0],[\\"props\\",0],[\\"rest\\",0],[\\"plugsMgt\\",0],[\\"depsMgt\\",0],[\\"plugins\\",0],[\\"deps\\",0]]]",
                    "url": ""
                  },
                  "apps": [],
                  "tags": [
                    {
                      "name": "2.2.0-20170928175629+travis1166",
                      "release": null,
                      "containers": []
                    },
                    {
                      "name": "2.2.0-20170928175629",
                      "release": null,
                      "containers": []
                    }
                  ],
                  "author": {
                    "login": "cdupuis",
                    "person": {
                      "chatId": {
                        "screenName": "cd"
                      }
                    }
                  },
                  "timestamp": "2017-09-28T19:53:38+02:00"
                }
              ],
              "timestamp": "2017-09-28T17:53:39.382Z",
              "branch": "master"
            }
          ],
          "timestamp": "2017-09-28T19:53:38+02:00"
        }
      }
    ]
  },
  "extensions": {
    "type": "READ_ONLY",
    "operationName": "StatusToPushLifecycle",
    "team_id": "T095SFFBK",
    "correlation_id": "d6e489ed-c251-4318-9f18-af6d68a11c97"
  }
}`;
    /* tslint:enable */

    it("should render multiple images", done => {
        const event = JSON.parse(multipleImages) as
            EventFired<graphql.StatusToPushLifecycle.Subscription>;
        const status = event.data.Status[0];
        const push = status.commit.pushes[0];
        const renderer = new K8PodNodeRenderer();
        renderer.render(push, [], {attachments: []}, undefined).then(msg => {
            const expected = [
                {
                    actions: [],
                    author_icon: "https://images.atomist.com/rug/kubes.png",
                    author_name: "Containers",
                    fallback: "prod - 1 running",
                    footer: "sforzando-dockerv2-local.jfrog.io/srv1:0.1.0",
                    mrkdwn_in: [
                        "text",
                    ],
                    text: "`prod` 1 running",
                },
                {
                    actions: [],
                    fallback: "prod - 0 running",
                    footer: "sforzando-dockerv2-local.jfrog.io/srv1:0.2.0",
                    mrkdwn_in: [
                        "text",
                    ],
                    text: "`prod` 0 running",
                },
            ];
            assert.deepEqual(msg.attachments, expected);
        })
            .then(done, done);
    });

});
