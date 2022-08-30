import ControllClient from './controller.js';
import { UserModel } from '../../model/index.js';
import { clientPayloadSensor, clientStatusNode } from '../../diagram/eventName.js';

export default async function ({ idUser, skClient, mainEvent }) {
  
  console.log(`[_client_] with [id]: ${idUser} is connected!`); // claim client is connected!

  try {
    const checkUser = await UserModel.User.findById(idUser);
    if(checkUser) {
      const eventPayloadSensor = clientPayloadSensor({ id: idUser });
      const eventStatusNode = clientStatusNode({ id: idUser });
      const controller = new ControllClient(skClient, idUser, mainEvent);
      
      mainEvent.on(eventPayloadSensor, controller.handlePayloadSensorSendByNode);

      mainEvent.on(eventStatusNode, controller.handleStatusNode);

      skClient.on('message', controller.handleMessageIsComing);
      
      skClient.on('close', () => {
        controller.updateStatusClient({ idClient: idUser, status: 'offline' });
        mainEvent.removeListener(eventPayloadSensor, controller.handlePayloadSensorSendByNode);
        mainEvent.removeListener(eventStatusNode, controller.handleStatusNode);
      });

      skClient.on('error', () => {
        controller.updateStatusClient({ idClient: idUser, status: 'offline' });
        skClient.terminate();
      });

      controller.updateStatusClient({ idClient: idUser, status: 'online' });

      skClient.send(
        JSON.stringify({ type: "$message", message: "_USER_ID_EXIST_" })
      );
    }else {
      skClient.send(
        JSON.stringify({ type: "$message", message: "_USER_ID_NOT_EXIST_" })
      );
    }
    
  } catch (error) {
    if (error.name === "CastError") {
      skClient.send(
        JSON.stringify({
          type: "$message",
          message: "_CLIENT_ID_INVALID_",
        })
        );
    }else {
      console.log(error);
    }
  }

}
