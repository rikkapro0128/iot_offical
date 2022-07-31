import { NodeESP8266Model, SensorModel } from '../model/index.js';

export default (node, req) => {

  const ip = req.socket.remoteAddress;
  console.log(`_esp8266_ with _${ip}_ is connected!`);

  node.on('message', async function message(data) {
    const dataParse = JSON.parse(data.toString());
    if(dataParse.type_data === '$info_node') {
      const nodeIsExist = await NodeESP8266Model.findOne({ macAddress: dataParse.ip_mac });
      if(!nodeIsExist) {
        const newNode = new NodeESP8266Model({
          desc: dataParse.desc,
          macAddress: dataParse.ip_mac,
          ipRemote: ip,
          typeModel: dataParse.type,
          configBy: dataParse.config_by,
        });
        const resultSensor = dataParse.sensor_manager.map(async (value, index) => {
          // frame data => [nameSensor|type_model|uint|desc]
          const valueSensor = value.split('|');
          const newSensor = new SensorModel({
            name:  valueSensor[0],
            desc:  valueSensor[3] !== 'NONE' ? valueSensor[3] : 'no-desc',
            unit: valueSensor[2],
            typeModel: valueSensor[1] !== 'NONE' ? valueSensor[1] : 'no-type-model',
            byNode: newNode._id,
          });
          await newSensor.save();
          newNode.sensors.push(newSensor._id);
          return Promise.resolve(true);
        });
        await Promise.all(resultSensor);
        await newNode.save();
        node.send(JSON.stringify({ type: '$message', message: '_INFO_NODE_SAVED_' }));
      }
    }
  });

  node.on('close', (code ,reason) => {
    console.log(code ,reason);
  })

  node.on('error', (error) => {
    console.log(error);
  })

}