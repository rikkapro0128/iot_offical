import mongoose from 'mongoose';
const { Schema } = mongoose;
import diagram from '../../diagram/index.js';

/**
 * Define Schemas
 */

const SensorSheme = new Schema({
  name:  { type: String, require: true },
  desc: { type: String, default: 'no-desc' },
  value: { type: String, default: '' },
  unit: { type: String, require: true },
  pin: { type: String, },
  typeModel: { type: String },
  byNode: { type: Schema.Types.ObjectId, ref: 'NodeESP8266' }
}, { 
  createdAt: 'sensor_create_at',
  updatedAt: 'sensor_updated_at' 
});

const DeviceSheme = new Schema({
  name:  { type: String, require: true },
  desc: { type: String, default: 'no-desc' },
  value: { type: String, default: '' },
  pins: [
    {
      _id: false,
      val: { type: String },
      gpio: { type: Number }
    }
  ],
  unit: { type: String, enum: ['DIGITAL', 'ANALOG', 'ONE_WIRE'], default: 'DIGITAL' },
  typeModel: { type: String },
  byNode: { type: Schema.Types.ObjectId, ref: 'NodeESP8266' }
}, { 
  createdAt: 'sensor_create_at',
  updatedAt: 'sensor_updated_at' 
});

const NodeESP8266Sheme = new Schema({
  name: { type: String, default: 'ESP8266' },
  desc: { type: String, default: 'no-desc' },
  macAddress: { type: String, require: true },
  ipRemote: { type: String, require: true },
  typeModel: { type: String },
  configBy: { type: String, default: 'miru' },
  sensors: [{ type: Schema.Types.ObjectId, ref: 'Sensor' }],
  devices: [{ type: Schema.Types.ObjectId, ref: 'Device' }]
}, { 
  createdAt: 'node_create_at',
  updatedAt: 'node_updated_at' 
});

DeviceSheme.pre('save', async function (next) {
  try {
    const resultPins = this.pins.map(valPin => {
      const pinDetail = diagram.esp8266.find(valDiagram => valPin.val in valDiagram);
      if(pinDetail) {
        return { val: valPin.val, gpio: Object.values(pinDetail)[0] }
      }
    });
    this.pins = await Promise.all(resultPins);
    next();
  } catch (error) {
    next(error);    
  }
})

const Sensor = mongoose.model('Sensor', SensorSheme); 
const Device = mongoose.model('Device', DeviceSheme); 
const NodeESP8266 = mongoose.model('NodeESP8266', NodeESP8266Sheme); 

export default {
  Sensor,
  Device,
  NodeESP8266,
} 
