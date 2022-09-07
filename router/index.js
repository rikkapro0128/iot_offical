import routerUser from "./user/index.js";
import routerNode from "./node/index.js";
import routerProfile from "./test/index.js";
import middleware from "../middleware/index.js";

const serverSayHello = `
  <link rel="icon" href="/static/common/iot.svg" type = "image/x-icon">
  <pre>
        ╔═════════════════════╦═════════════╗         
        ║ © Copyright by Miru ║  31/08/2022 ║         
        ╚═════════════════════╩═════════════╝         
     ▄▄   ▄▄ ▄▄▄ ▄▄▄▄▄▄   ▄▄   ▄▄         ▄▄   ▄▄ ▄▄▄ ▄▄  
    █  █▄█  █   █   ▄  █ █  █ █  █       █  █ █  █   █  █ 
    █       █   █  █ █ █ █  █ █  █       █  █▄█  █   █  █ 
    █       █   █   █▄▄█▄█  █▄█  █       █       █   █  █ 
    █       █   █    ▄▄  █       █▄▄▄    █   ▄   █   █▄▄█ 
    █ ██▄██ █   █   █  █ █       █▄  █   █  █ █  █   █▄▄  
    █▄█   █▄█▄▄▄█▄▄▄█  █▄█▄▄▄▄▄▄▄█ █▄█   █▄▄█ █▄▄█▄▄▄█▄▄█
  </pre>
`;

export default function (app) {
  app.use("/api/user", routerUser);
  app.use("/api/test", middleware.auth, routerProfile);
  app.use("/api/node", middleware.auth, routerNode);
  app.get("/", (req, res) => {
    res.send(serverSayHello);
  });
}
