import { NodeModel } from "../../model/index.js";
import controllerNode from "./controller.js";
import { nodeControllDevice } from '../../diagram/eventName.js';

export default async function ({ skNode, ip, idNode, mainEvent, idUser }) {

  console.log(`[_esp8266_] with [id]: ${idNode} is connected!`); // claim node is connected!

  try {
    const checkNode = await NodeModel.NodeMCU.findById(idNode);
    if (checkNode) {
      // if node is exist
      const eventControllDevice = nodeControllDevice({ id: idNode });
      const controller = new controllerNode(skNode, mainEvent, idNode, idUser, ip);

      controller.updateStatusNode({ id: idNode, status: "online" });

      // register event hanlde controll device of this node
      mainEvent.on(eventControllDevice, controller.sendPayloadToDevice);
      
      // handle message is comming!
      skNode.on("message", controller.handleMessageIsComming);
      
      // handle socket when node close connection 
      skNode.on("close", (code, reason) => {
        console.log(code, reason);
        if (code === 1006) {
          // controller
          controller.updateStatusNode({ id: idNode, status: "offline" });
        }
      });

      // active for node
      skNode.on("error", (error) => {
        controller.updateStatusNode({ id: idNode, status: "offline" });
        console.log(error);
        skNode.terminate();
      });

      skNode.send(
        JSON.stringify({ type: "$message", message: "_NODE_IS_EXIST_" })
      );

    }else {
      skNode.send(
        JSON.stringify({
          type: "$message",
          message: "_NODE_IS_NOT_EXIST_",
        })
      );
    }
  } catch (error) {
    if (error.name === "CastError") {
      skNode.send(
        JSON.stringify({
          type: "$message",
          message: "_NODE_PROVIDE_ID_INVALID_",
        })
      );
    } else {
      console.log(error);
      skNode.send(
        JSON.stringify({
          type: "$message",
          message: "_NODE_PROVIDE_PAYLOAD_INVALID_",
        })
      );
    }
  }
}
