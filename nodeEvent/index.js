import { NodeModel } from '../model/index.js';

export default (node, req, connections) => {

  const ip = req.socket.remoteAddress;
  console.log(`_esp8266_ with _${ip}_ is connected!`);

  node.on('message', async function message(data) {
    try {
      const dataParse = JSON.parse(data.toString());
      if(dataParse.type_data === '$info_node') {
        const nodeIsExist = await NodeModel.NodeESP8266.findOne({ macAddress: dataParse.ip_mac });
        if(!nodeIsExist) {
          const newNode =  new NodeModel.NodeESP8266({
            ipRemote: ip,
            desc: dataParse.desc,
            typeModel: dataParse.type,
            macAddress: dataParse.ip_mac,
            configBy: dataParse.config_by,
          });
          const resultSensor = dataParse.sensor_manager.map(async (value, index) => {
            // frame data => [name|type_model|uint|desc|pin]
            const valueSensor = value.split('|');
            const newSensor = new NodeModel.Sensor({
              name:  valueSensor[0],
              desc:  valueSensor[3] !== 'NONE' ? valueSensor[3] : 'no-desc',
              pin:  valueSensor[4] !== 'NONE' ? valueSensor[3] : 'no-pin',
              unit: valueSensor[2],
              typeModel: valueSensor[1] !== 'NONE' ? valueSensor[1] : 'no-type-model',
              byNode: newNode._id,
            });
            await newSensor.save();
            newNode.sensors.push(newSensor._id);
            return Promise.resolve(true);
          });
          const resultDevice = dataParse.device_manager.map(async (value, index) => {
            // frame data => [name|type_model|{DIGITAL-ANALOG-ONE_WIRE}|desc|{muti-solo}|{list_pin}]
            const valueDevice = value.split('|');
            const newDevice = new NodeModel.Device({
              name:  valueDevice[0],
              desc:  valueDevice[3] !== 'NONE' ? valueDevice[3] : 'no-desc',
              pins:  valueDevice[4] === 'MUTI' ? valueDevice[5].split('+').map(val => { return { val } }) : [{ val: valueDevice[5] }],
              unit: valueDevice[2],
              typeModel: valueDevice[1] !== 'NONE' ? valueDevice[1] : 'no-type-model',
              byNode: newNode._id,
            });
            await newDevice.save();
            newNode.devices.push(newDevice._id);
            return Promise.resolve(true);
          });
          await Promise.all([...resultSensor, ...resultDevice]);
          await newNode.save();
          node.send(JSON.stringify({ type: '$message', message: '_INFO_NODE_SAVED_', idNode: newNode._id }));
        }else {
          node.send(JSON.stringify({ type: '$message', message: '_NODE_IS_EXIST_', idNode: nodeIsExist._id }));
        }
      }else if(dataParse.type_data === '$data_sensor') {
        const sensor = await NodeModel.Sensor.findOne({ byNode: dataParse.id_node, typeModel: dataParse.type_model });
        sensor.value = `${dataParse.temp}+${dataParse.humi}`;
        await sensor.save();
      }
    } catch (error) {
      console.log(error);
    }
  });

  node.on('close', (code ,reason) => {
    console.log(code ,reason);
  })

  node.on('error', (error) => {
    console.log(error);
  })

}