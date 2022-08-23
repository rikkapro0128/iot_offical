import { NodeModel } from "../../model/index.js";
import {
  clientPayloadSensor,
  clientStatusNode,
} from "../../diagram/eventName.js";
import help from "../../ultils/index.js";

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

  sendPayloadToDevice({ model, pins, idDevice }, skClient) {
    // console.log("Node received: ", { model, pins });
    this.skNode.send(
      JSON.stringify({ type: "$controll_device", model, pins }),
      async function (error) {
        if (!error) {
          // save data device into device
          skClient.send(
            JSON.stringify({
              type: "$message",
              message: "_NODE_RECEIVED_PAYLOAD_DEVICE_",
            })
          );
          const searchDevice = await NodeModel.Device.findById(idDevice);
          searchDevice.pins = searchDevice.pins.map((pinSolo) => {
            for (const pin of pins) {
              if (pin.gpio === pinSolo.gpio) {
                return {
                  ...pin,
                  val: pinSolo.val,
                };
              }
            }
            return pinSolo;
          });
          await searchDevice.save();
        }
        // else {
        //   console.log(error);
        //   skClient.send(JSON.stringify({ type: "$message", message: '_NODE_RECEIVED_IS_ERROR_' }));
        // }
      }
    );
  }

  updateStatusNode({ id, status }) {
    NodeModel.NodeMCU.findOneAndUpdate(
      { _id: id },
      { socketStatus: status }
    ).exec();
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
        // console.log(payload.type_data);
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
        // reset data sensor & device old
        // await NodeModel.Device.deleteMany({ byNode: this.idNode });
        // await NodeModel.Sensor.deleteMany({ byNode: this.idNode });

        const resultSensor = payload.sensor_manager.map(async (value, index) => {
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
          let findSensor = await NodeModel.Sensor.findOneAndUpdate({ typeModel: valueSensor[1] }, dataSensor);
          if(findSensor) {
            return Promise.resolve(true);
          }else {
            const newSensor = new NodeModel.Sensor(dataSensor);
            return newSensor.save();
          }
        });
        const resultDevice = payload.device_manager.map(async (value, index) => {
          // frame data => [name|type_model|{DIGITAL-ANALOG-ONE_WIRE}|desc|{muti-solo}|{list_pin}|NEW]
          const valueDevice = value.split("|");
          const dataDevice = {
            name: valueDevice[0],
            desc: valueDevice[3] !== "NONE" ? valueDevice[3] : "no-desc",
            unit: valueDevice[2],
            typeModel: valueDevice[1],
            byNode: this.idNode,
          };
          let findDevice = await NodeModel.Device.findOneAndUpdate({ typeModel: valueDevice[1] }, dataDevice);
          if(findDevice) {
            return Promise.resolve(true);
          }else {
            const newDevice = new NodeModel.Device(dataDevice);
            newDevice.pins = valueDevice[4] === "MUTI" ? valueDevice[5].split("+").map((val) => { return { val }; }) : [{ val: valueDevice[5] }];
            return newDevice.save();
          }
        });
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
          sensor.sample.push({ value: { temperature: payload.temp, humidity: payload.humi }})
          sensor
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
                  message: "_SENSOR_IS_UPDATE_",
                })
              );
            })
            .catch((error) => {
              if (error.name === "DocumentNotFoundError") {
                this.skNode.send(
                  JSON.stringify({
                    type: "$message",
                    message: "_SENSOR_IS_REMOVE_",
                  })
                );
              } else {
                console.log(error);
              }
            });
        }
      }
    } catch (error) {
      console.log(error);
    }
  }
}

export default node;
