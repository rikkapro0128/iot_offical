import { UserModel, NodeModel } from '../../model/index.js';

class Node {
  async list(req, res, next) { // [GET]: /api/node/list
    const idUser = req.idClientUser;
    const user = await UserModel.User.findById(idUser);
    res.status(200).json({ message: 'response data from server!', node_list: user.nodeManage });
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
      const { name, typeModal, desc } = newNode;
      res.status(200).json({ message: 'create node successfull!', node: { name, typeModal, desc } });
    } catch (error) {
      res.status(401).json({ message: 'something went wrong!' });
    }
  }
}

export default new Node;