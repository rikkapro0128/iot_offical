import { UserModel } from '../../model/index.js';

class Node {
  async list(req, res, next) { // [GET]: /api/node/list
    const idUser = req.idClientUser;
    const user = await UserModel.User.findById(idUser);
    res.status(200).json({ message: 'response data from server!', node_list: user.nodeManage });
  }
  async create(req, res, next) { // [POST]: /api/node/create
    console.log('create node');
    res.status(200).json({ message: 'response data from server!' });
  }
}

export default new Node;