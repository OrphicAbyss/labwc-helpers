"use strict";

import path from "path";
import { fileURLToPath } from "url";

import open_display from "wayland-client";

const SYMBOL_CURRENT="";
const SYMBOL_OTHER="";

const thisDir = path.dirname(fileURLToPath(import.meta.url));

open_display().then(async (display) => {
    display.on("warning", console.warn);
    display.on("error", console.error.bind(console, "display ERROR: "));

    //await display.load(path.join(thisDir, "ext-workspace-v1.xml"));
    await display.load(path.join(thisDir, "cosmic-workspace-unstable-v1.xml"));

    //let workspaces = await display.bind("ext_workspace_manager_v1");
    let workspaces = await display.bind("zcosmic_workspace_manager_v1");
    //let workspace_groups = await display.bind("zcosmic_workspace_group_handle_v1");

    workspaces.on("capabilities", (capabilities) => {
        console.log("capabilities event", capabilities);
    });

    let workspacesObjs = {};
    workspaces.on("workspace_group", (workspace_group) => {
        //console.log("workspace_group event", workspace_group);

        //console.log("subscribing to workspace events");
        workspace_group.on("workspace", (workspace) => {
            let workspaceObj = {id: workspace.id};
            workspacesObjs[workspace.id] = workspaceObj;

            //console.log("workspace event", workspace);
            //console.log("Workspace id:", workspace.id);

            workspace.on("name", (name) => {
                workspaceObj.name = name;
                //console.log("name event", workspaceObj);
            });
            workspace.on("state", (state) => {
                workspaceObj.state = state;
                //console.log("state event", workspaceObj);
            });
            workspace.on("capabilities", (capabilities) => {
                workspaceObj.capabilities = capabilities;
                //console.log("capabilities event", workspaceObj);
            });
        });
    });
    //workspace_groups.on("workspace", (workspace) => {console.log("workspace event", workspace); });

    workspaces.on("done", () => {
        //console.log("done event");
        //console.log(workspacesObjs);

        const wss = Object.keys(workspacesObjs).map(key => workspacesObjs[key]);
        let output = wss
            .map((ws) => ws.state[0] === 0 ? SYMBOL_CURRENT : SYMBOL_OTHER)
            .join(" ") + "  - " + wss.filter((ws) => ws.state[0] === 0)
            .map((ws) => ws.name).join("");
        console.log(output);
    });
    workspaces.on("finished", () => {
        console.log("finished event");
        process.exit(0);
    });

    async function exit() {
        await workspaces.stop();
    }

    process.on("SIGTERM", exit);
    process.on("SIGINT", exit);
});

