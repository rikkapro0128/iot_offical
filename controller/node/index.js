import { UserModel, NodeModel } from '../../model/index.js';

class Node {
  async list(req, res, next) { // [GET]: /api/node/list
    const idUser = req.idClientUser;
    const listNode = await NodeModel.NodeMCU.find({ bindUser: idUser }, '-bindUser -configBy -devices -sensors');
    res.status(200).json({ message: 'response data from server!', node_list: listNode });
  }

  async create(req, res, next) { // [POST]: /api/node/create
    try {
      const idUser = req.idClientUser;
      const { nameNode, descNode, nodeModal } = req.body;
      if(!nameNode) { return res.status(401).json({ message: 'field {nameNode} is undefined!' }) }
      if(!nodeModal) { return res.status(401).json({ message: 'field {nodeModal} is undefined!' }) }
      const newNode = new NodeModel.NodeMCU({
        name: nameNode,
        typeModal: nodeModal,
        bindUser: idUser,
      })
      if(descNode) { newNode.desc = descNode };
      await newNode.save();
      const { name, typeModal, desc, _id } = newNode;
      res.status(200).json({ message: 'create node successfull!', node: { _id, name, typeModal, desc } });
    } catch (error) {
      res.status(401).json({ message: 'something went wrong!' });
    }
  }

  async remove(req, res, next) { // [DELETE]: /api/node/remove/:id
    try {
      const idUser = req.idClientUser;
      const idNode = req.params.id;
      const node = await NodeModel.NodeMCU.findById(idNode);
      if(node) {
        if(node.bindUser.toString() === idUser) {
          // remove all device & sensor depend-on
          await NodeModel.Device.deleteMany({ byNode: idNode });
          await NodeModel.Sensor.deleteMany({ byNode: idNode });
          NodeModel.NodeMCU.findByIdAndRemove(idNode).exec()
          .then(response => {
            res.status(200).json({ message: 'remove node successfull!', idNode });
          })
          .catch(err => {
            res.status(500).json({ message: 'can\'t remove node!', idNode });
          })
        }else {
          return res.status(403).json({ message: 'You not permission remove this node!', idNode });
        }
      }
    } catch (error) {
      res.status(401).json({ message: 'something went wrong!' });
    }
  }
}

export default new Node;