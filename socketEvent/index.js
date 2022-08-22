import nodeHandler from './nodeHandler/index.js';
import clientHandler from './clientHandler/index.js';
import { NodeModel } from '../model/index.js';

export default async (wsk, req, mainEvent) => {

  const ip = req.socket.remoteAddress;
  const checkLocation = req.headers['location-request'];
  
  if(checkLocation === 'node') {
    const idNode = req.headers['id-node'];
    const findNode = await NodeModel.NodeMCU.findById(idNode);
    nodeHandler({ ip, skNode: wsk, idNode, mainEvent, idUser: findNode.bindUser });
  }else if(checkLocation === 'client') {
    const idClient = req.headers['id-client'];
    clientHandler({ idUser: idClient, skClient: wsk, mainEvent });
  }

}