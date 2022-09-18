import { UserModel, NodeModel } from "../../model/index.js";
import helper from "../../ultils/index.js";

const timelineToSecond = {
  minute: 60,
  hour: 60 * 60,
  date: 24 * 3600,
};

class Node {
  async provider(req, res, next) {
    // [GET]: /api/node/:id
    try {
      const idNode = req.params.id;
      const stateSensors = req.query.sensors;
      const stateDevices = req.query.devices;
      const responseData = {};
      const resultPromise = [];
      if (idNode) {
        responseData.idNode = idNode;
        NodeModel.NodeMCU.findById(idNode, "socketStatus").then((node) => {
          responseData.socketStatus = node.socketStatus;
        });
        if (stateSensors === "true") {
          const listSensor = NodeModel.Sensor.find({ byNode: idNode }).then(
            async (sensors) => {
              const resultSensors = sensors.map(async (sensor) => {
                const sampleSensor = await NodeModel.SensorSample.findOne({
                  bindSensor: sensor._id,
                }).sort({ updateAt: -1 });
                return {
                  sensor,
                  sampleSensor,
                };
              });
              return Promise.all(resultSensors);
            }
          );
          resultPromise.push(listSensor);
        }
        if (stateDevices === "true") {
          const listDevice = NodeModel.Device.find({ byNode: idNode }).then(
            async (devices) => {
              const resultDevices = devices.map(async (device) => {
                const resultPins = device.pins.map(async ({ val, gpio }) => {
                  const resultPayload = await NodeModel.DevicePayload.findOne({
                    bindDevice: device._id,
                    val,
                    gpio,
                  });
                  return resultPayload ? resultPayload : { val, gpio };
                });
                return {
                  ...device.toObject(),
                  pins: await Promise.all(resultPins),
                };
              });
              return Promise.all(resultDevices);
            }
          );
          resultPromise.push(listDevice);
        }
        const result = await Promise.all(resultPromise);
        responseData.sensors = result[0] ? result[0] : undefined;
        responseData.devices = result[1] ? result[1] : undefined;
        res
          .status(200)
          .json({ message: "response data from server!", responseData });
      }
    } catch (error) {
      console.log(error);
      res.status(401).json({ message: "something went wrong!" });
    }
  }

  async list(req, res, next) {
    // [GET]: /api/node/list
    try {
      const idUser = req.idClientUser;
      const listNode = await NodeModel.NodeMCU.find(
        { bindUser: idUser, status: { $in: ["init", "updated", null] } },
        "-bindUser -configBy -devices -sensors"
      );
      res
        .status(200)
        .json({ message: "response data from server!", node_list: listNode });
    } catch (error) {
      res.status(401).json({ message: "something went wrong!" });
    }
  }

  async create(req, res, next) {
    // [POST]: /api/node/create
    try {
      const idUser = req.idClientUser;
      const { nameNode, descNode, nodeModal } = req.body;
      if (!nameNode) {
        return res
          .status(401)
          .json({ message: "field {nameNode} is undefined!" });
      }
      if (!nodeModal) {
        return res
          .status(401)
          .json({ message: "field {nodeModal} is undefined!" });
      }
      const newNode = new NodeModel.NodeMCU({
        name: nameNode,
        typeModal: nodeModal,
        bindUser: idUser,
      });
      if (descNode) {
        newNode.desc = descNode;
      }
      await newNode.save();
      const { name, typeModal, desc, _id } = newNode;
      res.status(200).json({
        message: "create node successfull!",
        node: { _id, name, typeModal, desc },
      });
      await helper.createHistory({
        bind: idUser,
        action: "_add_node_",
        options: { idNode: _id },
      });
    } catch (error) {
      res.status(401).json({ message: "something went wrong!" });
    }
  }

  async remove(req, res, next) {
    // [DELETE]: /api/node/remove/:id
    try {
      const idUser = req.idClientUser;
      const ids = req.body.nodeIDs;
      if (ids?.length > 0) {
        const nodes = await NodeModel.NodeMCU.find({ _id: { $in: ids } });
        const checkNodes = nodes.map(async (node) => {
          if (node.bindUser.toString() === idUser) {
            await NodeModel.NodeMCU.updateOne(
              { _id: node._id },
              { status: "removed" }
            );
            return Promise.resolve({ id: node._id, statusRemove: "done" });
          } else {
            return Promise.resolve({ id: node._id, statusRemove: "refuse" });
          }
        });
        const tempNodes = await Promise.all(checkNodes);

        res
          .status(200)
          .json({ message: "remove node successfull!", nodeIDs: tempNodes });

        const count = tempNodes.reduce(
          (hold, value) => (value.statusRemove === "done" ? ++hold : hold),
          0
        );
        const lsID = tempNodes
          .map((value) => (value.statusRemove === "done" ? value.id : null))
          .filter((value) => value !== null);
        await helper.createHistory({
          bind: idUser,
          action: "_remove_node_",
          options: { total: count, idNode: lsID },
        });
      } else {
        res.status(403).json({ message: "field {nodeIDs} is empty!" });
      }
    } catch (error) {
      console.log(error);
      res.status(401).json({ message: "something went wrong!" });
    }
  }

  async chartSensor(req, res, next) {
    // [GET]: /api/node/sensor?timeline={hour|date|week|month}
    const timeline = req.query.timeline;
    const sort = req.query.sort || "asc"; // sortby: [asc: ascending {or} desc: descending]
    const id = req.params.id;
    try {
      if (!timeline) {
        return res
          .status(401)
          .json({ message: "query url {timeline} not exist!" });
      }
      if (!id) {
        return res.status(401).json({ message: "params {id} not exist!" });
      }

      switch (timeline) {
        case "hour":
          const range = parseInt(req.query.range) || 5; // sortby: [asc: ascending {or} desc: descending]
          let timestampStart = Date.now() - 3600 * 1000;
          const timestampRange = range * 60 * 1000;
          const timeScan = (time) => ({
            hour: new Date(time).getHours(),
            min: new Date(time).getMinutes(),
          });
          let payloadSensorOnehour = await NodeModel.SensorSample.find({
            bindSensor: id,
            createdAt: { $gt: new Date(timestampStart) },
          });
          const tranformPayloadSensor = payloadSensorOnehour
            .map((payload, index) => {
              const timeTemp = timeScan(timestampStart);
              const datePayload = timeScan(payload.createdAt);

              if (
                timeTemp.hour === datePayload.hour &&
                timeTemp.min === datePayload.min
              ) {
                timestampStart = timestampStart + timestampRange;
                const timeAt = `${timeTemp.hour}:${
                  timeTemp.min < 10 ? `0${timeTemp.min}` : timeTemp.min
                }`;
                return {
                  timeAt,
                  ...payload.toObject(),
                };
              } else {
                return null;
              }
            })
            .filter((payload) => payload !== null);
          res.status(200).json({
            message: "response payload chart successfull!",
            payloadLength: tranformPayloadSensor.length,
            payload:
              sort === "desc"
                ? tranformPayloadSensor.reverse()
                : tranformPayloadSensor,
          });
          break;

        default:
          res
            .status(401)
            .json({ message: "query url {timeline} not invalid!" });
          break;
      }
    } catch (error) {
      console.log(error);
      res.status(401).json({ message: "something went wrong!" });
    }
  }

  async chartSensorV2(req, res, next) {
    // [GET]: /api/node/sensor?timeline={hour|date|week|month}
    const timeline = req.query.timeline;
    const odd = parseInt(req.query.odd) || 10;
    const sort = req.query.sort || "asc"; // sortby: [asc: ascending {or} desc: descending]
    const id = req.params.id;
    try {
      if (!timeline) {
        return res
          .status(401)
          .json({ message: "query url {timeline} not exist!" });
      }
      if (!id) {
        return res.status(401).json({ message: "params {id} not exist!" });
      }

      if (timeline) {
        const range = parseInt(req.query.range) || 5; // range for one second
        let timestampStart = Date.now() - timelineToSecond[timeline] * 1000; // get timestamp at now
        const timestampRange = range * 1000;
        const createTimeQuery = Array(
          Math.round(timelineToSecond[timeline] / range) + 1
        )
          .fill(0)
          .map((_, index) => {
            if (index !== 0) {
              timestampStart = timestampStart + timestampRange;
            }
            return {
              startSearch: timestampStart - odd * 1000,
              endSearch: timestampStart + odd * 1000,
            };
          });
        let resultQuery = createTimeQuery.map(async (time) => {
          return NodeModel.SensorSample.findOne({
            bindSensor: id,
            createdAt: {
              $gt: new Date(time.startSearch),
              $lt: new Date(time.endSearch),
            },
          }).then((payload) => {
            if (payload === null) {
              return payload;
            }
            const timeAt = new Date(payload.createdAt);
            const hour = timeAt.getHours();
            const minute = timeAt.getMinutes();
            return {
              ...payload.toObject(),
              timeAt: `${hour}:${minute < 10 ? `0${minute}` : minute}`,
            };
          });
        });
        resultQuery = await Promise.all(resultQuery);
        resultQuery = resultQuery.filter((query) => query !== null);
        res.status(200).json({
          message: "response payload chart successfull!",
          payload: resultQuery,
        });
      } else {
        res.status(401).json({ message: "query url {timeline} not invalid!" });
      }
    } catch (error) {
      console.log(error);
      res.status(401).json({ message: "something went wrong!" });
    }
  }

  async updateNode(req, res, next) {
    try {
      const idUser = req.idClientUser;
      const nodesChange = req.body.nodesUpdate;
      const resultUpdateNodes = [];
      const tempProcess = Object.keys(nodesChange).map(async (id) => {
        const searchNode = await NodeModel.NodeMCU.findOne({
          _id: id,
          bindUser: idUser,
        });
        if (searchNode) {
          const payload = nodesChange[id];
          for (const field of Object.keys(payload)) {
            searchNode[field] = payload[field];
          }
          searchNode.status = "updated";
          const nodeSaved = await searchNode.save();
          resultUpdateNodes.push({
            node: nodeSaved.toObject(),
            status: "done",
          });
          return Promise.resolve(true);
        } else {
          resultUpdateNodes.push({ id, status: "refuse" });
          return Promise.resolve(true);
        }
      });
      await Promise.all(tempProcess);
      res.status(200).json({ message: "update node done!", resultUpdateNodes });
      const count = resultUpdateNodes.reduce((hold, value) => value.status === 'done' ? ++hold : hold, 0)
      const lsID = resultUpdateNodes
          .map((value) => (value.status === 'done' ? value.node._id : null))
          .filter((value) => value !== null);
      await helper.createHistory({
        bind: idUser,
        action: "_change_info_node_",
        options: { total: count, idNode: lsID },
      });

    } catch (error) {
      console.log(error);
      res.status(401).json({ message: "something went wrong!" });
    }
  }
}

export default new Node();
