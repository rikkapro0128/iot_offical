import nodeHandler from './nodeHandler/index.js';
import clientHandler from './clientHandler/index.js';
import { NodeModel } from '../model/index.js';

export default async (wsk, req, mainEvent) => {

  const ip = req.socket.remoteAddress;
  const checkLocation = req.headers['location-request'];
  
  if(checkLocation === 'node') {
    const idNode = req.headers['id-node'];
    const findNode = await NodeModel.NodeMCU.findById(idNode);
    if(findNode) {
      nodeHandler({ ip, skNode: wsk, idNode, mainEvent, idUser: findNode.bindUser });
    }else {
      // terminate this socket from mcu 
    }
  }else {
    const idClient = new URL('http://localhost' + req.url).searchParams.get('id-client');
    if(idClient) {
      clientHandler({ idUser: idClient, skClient: wsk, mainEvent });
    }
  }

}