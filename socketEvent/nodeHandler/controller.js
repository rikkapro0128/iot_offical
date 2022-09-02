import { NodeModel } from "../../model/index.js";
import {
  clientPayloadSensor,
  clientStatusNode,
} from "../../diagram/eventName.js";
import help from "../../ultils/index.js";
import diagram from '../../diagram/index.js';

let statusNodeResponse = true;
class node {
  constructor(skNode, mainEvent, idNode, idUser, ip) {
    this.skNode = skNode;
    this.mainEvent = mainEvent;
    this.idNode = idNode;
    this.idUser = idUser;
    this.ip = ip;
    this.sendPayloadToDevice = this.sendPayloadToDevice.bind(this);
    this.handleMessageIsComming = this.handleMessageIsComming.bind(this);
  }

  async sendPayloadToDevice({ model, pins, idDevice }, skClient) {
    // console.log("Node received: ", { model, pins });
    const searchDevice = await NodeModel.Device.findById(idDevice);
    if(!searchDevice) { return skClient.send(JSON.stringify({ type: "$message", message: '_DEVICE_NOT_EXIST_' })); }
    const permitPinControll = pins.filter(valuePin => {
      const result = searchDevice.pins.find(pinSearch => (pinSearch.val === valuePin.val && pinSearch.gpio === valuePin.gpio));
      return result ? true : false;
    })
    // console.log(permitPinControll);
    if(statusNodeResponse) {
      this.skNode.send(JSON.stringify({ type: "$controll_device", model, pins: permitPinControll }));
      const resultUpdateDevice = pins.map(async (valuePin) => {
        const searchDevicePayload =
          await NodeModel.DevicePayload.findOneAndUpdate({
            bindDevice: searchDevice._id,
            val: valuePin.val,
          }, {
            ...valuePin,
          });
        if (searchDevicePayload) {
          return Promise.resolve(true);
        } else {
          const newDevicePayload = new NodeModel.DevicePayload({
            bindDevice: searchDevice._id,
            ...valuePin
          });
          return newDevicePayload.save();
        }
      });
      await Promise.all(resultUpdateDevice);
      skClient.send(JSON.stringify({ type: "$message", message: '_DEVICE_IS_UPDATED_', id: idDevice }));
    }else {
      skClient.send(JSON.stringify({ type: "$message", message: '_DEVICE_PINS_INVALID_' }));
    }
  }

  async updateStatusNode({ id, status }) {
    await NodeModel.NodeMCU.findOneAndUpdate(
      { _id: id },
      { socketStatus: status }
    );
    console.log(status);
    const eventNameForClient = clientStatusNode({ id: this.idUser });
    const isHaveEvent = help.checkEventNameIsExist({
      nameEvent: eventNameForClient,
      mainEvent: this.mainEvent,
    });
    if (isHaveEvent) {
      this.mainEvent.emit(eventNameForClient, {
        idNode: id,
        status,
      });
    }
  }

  async handleMessageIsComming(data) {
    const payload = JSON.parse(data.toString());
    try {
      if (payload.type_data === "$info_node") {
        // console.log(payload);
        NodeModel.NodeMCU.findOneAndUpdate(
          {
            _id: this.idNode,
          },
          {
            ipRemote: this.ip,
            desc: payload.desc,
            typeModel: payload.type,
            macAddress: payload.ip_mac,
            configBy: payload.config_by,
          }
        ).exec();

        const resultSensor = payload.sensor_manager.map(
          async (value, index) => {
            // frame data => [name|type_model|uint|desc|pin]
            const valueSensor = value.split("|");
            const dataSensor = {
              name: valueSensor[0],
              desc: valueSensor[3] !== "NONE" ? valueSensor[3] : "no-desc",
              pin: valueSensor[4] !== "NONE" ? valueSensor[3] : "no-pin",
              unit: valueSensor[2],
              typeModel: valueSensor[1],
              byNode: this.idNode,
            };
            let findSensor = await NodeModel.Sensor.findOneAndUpdate(
              { typeModel: valueSensor[1] },
              dataSensor
            );
            if (findSensor) {
              return Promise.resolve(true);
            } else {
              const newSensor = new NodeModel.Sensor(dataSensor);
              return newSensor.save();
            }
          }
        );
        const resultDevice = payload.device_manager.map(
          async (value, index) => {
            // frame data => [name|type_model|{DIGITAL-ANALOG-ONE_WIRE}|desc|{muti-solo}|{list_pin}|NEW]
            const valueDevice = value.split("|");
            // create update object for device
            const dataDevice = {
              name: valueDevice[0],
              desc: valueDevice[3] !== "NONE" ? valueDevice[3] : "no-desc",
              unit: valueDevice[2],
              typeModel: valueDevice[1],
              byNode: this.idNode,
              pins:
                valueDevice[4] === "MUTI"
                  ? valueDevice[5].split("+").map((val) => {
                      return { val };
                    })
                  : [{ val: valueDevice[5] }],
            };
            // update gpio pins
            dataDevice.pins = dataDevice.pins.map(valPin => {
              const pinDetail = diagram.esp8266.find(
                (valDiagram) => valPin.val in valDiagram
              );
              if (pinDetail) {
                return { gpio: Object.values(pinDetail)[0], ...valPin };
              }
            });
            let findDevice = await NodeModel.Device.findOneAndUpdate(
              { typeModel: valueDevice[1] },
              dataDevice
            );
            if (findDevice) {
              // for update 
              return findDevice.save();
            } else {
              // for create new
              const newDevice = new NodeModel.Device(dataDevice);
              return newDevice.save();
            }
          }
        );
        // update done for all sensor and all device
        await Promise.all([...resultSensor, ...resultDevice]);
        this.skNode.send(
          JSON.stringify({ type: "$message", message: "_NODE_IS_UPDATE_" })
        );
      } else if (payload.type_data === "$data_sensor") {
        // console.log(payload);
        const sensor = await NodeModel.Sensor.findOne({
          byNode: this.idNode,
          typeModel: payload.type_model,
        });
        if (sensor) {
          const newSampleSesor = new NodeModel.SensorSample({
            value: { temperature: payload.temp, humidity: payload.humi },
            bindSensor: sensor._id,
          });
          newSampleSesor
            .save()
            .then(async () => {
              const eventNameForClient = clientPayloadSensor({
                id: this.idUser,
              });
              const isHaveEvent = help.checkEventNameIsExist({
                nameEvent: eventNameForClient,
                mainEvent: this.mainEvent,
              });
              if (isHaveEvent) {
                const statusResponse = this.mainEvent.emit(eventNameForClient, {
                  model: sensor.typeModel,
                  name: sensor.name,
                  value: { temperature: payload.temp, humidity: payload.humi },
                  unit: sensor.unit,
                  idSensor: sensor._id,
                });
                if (!statusResponse) {
                  this.skNode.send(
                    JSON.stringify({
                      type: "$message",
                      message: "_CLIENT_NOT_LISTEN_",
                    })
                  );
                }
              }
              this.skNode.send(
                JSON.stringify({
                  type: "$message",
                  message: "_VALUE_SENSOR_IS_UPDATE_",
                })
              );
            })
            .catch((error) => {
              if (error.name === "DocumentNotFoundError") {
                this.skNode.send(
                  JSON.stringify({
                    type: "$message",
                    message: "_VALUE_SENSOR_CAN'T_SAVE_",
                  })
                );
              } else {
                console.log(error);
              }
            });
        }
      }else if (payload.type_data === "$init_device") {
        const getDevice = await NodeModel.Device.find({ byNode: this.idNode }, 'typeModel _id');
        if(getDevice.length > 0) {
          const listPayloadDevice = getDevice.map(async ({ _id, typeModel }) => {
            const payloadDevice = await NodeModel.DevicePayload.find({ bindDevice: _id }, 'val gpio mode payload status');
            return {
              model: typeModel,
              pins: payloadDevice,
            }
          });
          const initPayloadDevice = await Promise.all(listPayloadDevice);
          this.skNode.send(JSON.stringify({ type: '$init_device', payload: initPayloadDevice }));
        }
      }else if(payload.type_data === "$response" && payload.message === '_NODE_RECEIVED_PAYLOAD_') {
        statusNodeResponse = true;
      }
    } catch (error) {
      console.log(error);
    }
  }
}

export default node;
