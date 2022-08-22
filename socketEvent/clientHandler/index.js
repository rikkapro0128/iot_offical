import ControllClient from './controller.js';
import { UserModel } from '../../model/index.js';
import { clientPayloadSensor, clientStatusNode } from '../../diagram/eventName.js';

export default async function ({ idUser, skClient, mainEvent }) {
  
  console.log(`[_client_] with [id]: ${idUser} is connected!`); // claim client is connected!

  try {
    const checkUser = await UserModel.User.findById(idUser);
    if(checkUser) {
      const controller = new ControllClient(skClient, idUser, mainEvent);
      
      mainEvent.on(clientPayloadSensor({ id: idUser }), controller.handlePayloadSensorSendByNode);

      mainEvent.on(clientStatusNode({ id: idUser }), controller.handleStatusNode);

      skClient.on('message', controller.handleMessageIsComing);

      skClient.send(
        JSON.stringify({ type: "$message", message: "_USER_ID_EXIST_" })
      );
    }else {
      skClient.send(
        JSON.stringify({ type: "$message", message: "_USER_ID_NOT_EXIST_" })
      );
    }
    
  } catch (error) {
    console.log(error);
  }

}
