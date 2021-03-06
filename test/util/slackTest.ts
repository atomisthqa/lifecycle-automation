import "mocha";
import * as assert from "power-assert";

import { isChannel } from "../../src/util/slack";

describe("slack", () => {

    describe("checkChannelId", () => {

        it("should accept a valid ID", () => {
            ["CH4RL1312", "C2KDBBLBA"].forEach(i => {
                assert(isChannel(i));
            });
        });

        it("should require capital letters", () => {
            assert(!isChannel("ch4r1i3"));
        });

        it("should reject DMs", () => {
            ["D1LL0N123", "D7F0EFEJ2"].forEach(i => {
                assert(!isChannel(i));
            });
        });

        it("should accept private group chats", () => {
            ["GR8W1D0PN", "G767PBQBG"].forEach(i => {
                assert(isChannel(i));
            });
        });

    });

});
