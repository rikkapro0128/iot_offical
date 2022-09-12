import { NodeModel, UserModel } from '../../model/index.js';
import help from '../../ultils/index.js';
import { nodeControllDevice } from '../../diagram/eventName.js';

class client {

  constructor(skClient, id, mainEvent) {
    this.skClient = skClient;
    this.id = id;
    this.mainEvent = mainEvent;
    this.handleResponseDevice = this.handleResponseDevice.bind(this);
    this.handleStatusNode = this.handleStatusNode.bind(this);
    this.handleMessageIsComing = this.handleMessageIsComing.bind(this);
    this.handlePayloadSensorSendByNode = this.handlePayloadSensorSendByNode.bind(this);
  }

  handleResponseDevice(payload) {
    this.skClient.send(JSON.stringify({ type: "$response_devices", message: '_DEVICE_IS_UPDATED_', payload }));
  }

  updateStatusClient({ idClient, status }) {
    UserModel.User.findOneAndUpdate(
      { _id: idClient },
      { socketStatus: status }
    ).exec();
  }

  handleStatusNode({ idNode, status }) {
    this.skClient.send(JSON.stringify({ type: "$status_node", id: idNode, status }));
  }

  handlePayloadSensorSendByNode({ model, name, value, unit, idSensor }) {
    this.skClient.send(JSON.stringify({ type: "$payload_sensor", payload: { model, name, value, unit, idSensor } }));
  }

  async handleMessageIsComing(data) {
    try {
      const payload = JSON.parse(data.toString());
      if(payload.type === 'controll') {
        const idNode = payload.idNode;
        const checkNodeBindingUser = await NodeModel.NodeMCU.findById(idNode);
        if(checkNodeBindingUser) {
          // has permission controll node
          const idDevice = payload.idDevice;
          const checkDeviceBindingNode = await NodeModel.Device.findById(idDevice)
          if(checkDeviceBindingNode) {
            // has permission controll device
            const eventNameForNode = nodeControllDevice({ id: idNode });
            const isHaveEvent = help.checkEventNameIsExist({ nameEvent: eventNameForNode , mainEvent: this.mainEvent });
            if(isHaveEvent) {

              const statusResponse = this.mainEvent.emit(eventNameForNode, { 
                idDevice,
                model: checkDeviceBindingNode.typeModel,
                pins: payload.pins
              }, this.skClient);

              if(!statusResponse) {
                this.skClient.send(JSON.stringify({ type: "$message", message: "_NODE_NOT_LISTEN_" }));
              }
            }else {
              this.skClient.send(JSON.stringify({ type: "$message", message: "_NODE_IS_BUSSY_" }));
            }
          }else {
            this.skClient.send(JSON.stringify({ type: "$message", message: "_NOT_FOUND_DEVICE_" }));
          }
        }else {
          this.skClient.send(JSON.stringify({ type: "$message", message: "_NOT_FOUND_NODE_" }));
        }
      }
      // console.log(payload);
    } catch (error) {
      console.log(error);
      this.skClient.send(JSON.stringify({ type: "$message", message: "_SOMETHING_WENT_WRONG_" }));
    }
  }

}

export default client;
