import mongoose from 'mongoose';
const { Schema } = mongoose;
import diagram from '../../diagram/index.js';

/**
 * Define Schemas
 */

const SensorSampleSheme = new Schema({
  _id: false,
  value: { type: Schema.Types.Mixed },
}, { timestamps: true });

const SensorSheme = new Schema({
  name:  { type: String, require: true },
  desc: { type: String, default: 'no-desc' },
  sample: [SensorSampleSheme],
  unit: { type: String, require: true },
  pin: { type: String, },
  typeModel: { type: String, require: true },
  byNode: { type: Schema.Types.ObjectId, ref: 'NodeMCU' }
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
      gpio: { type: Number },
      status: { type: String },
      mode: { type: String },
      payload: { type: Schema.Types.Mixed },
    }
  ],
  unit: { type: String, enum: ['DIGITAL', 'ANALOG', 'ONE_WIRE'], default: 'DIGITAL' },
  typeModel: { type: String, require: true },
  byNode: { type: Schema.Types.ObjectId, ref: 'NodeMCU' }
}, { 
  createdAt: 'sensor_create_at',
  updatedAt: 'sensor_updated_at' 
});

const NodeMCUSheme = new Schema({
  name: { type: String, require: true },
  desc: { type: String, default: 'no-desc' },
  macAddress: { type: String },
  ipRemote: { type: String },
  typeModal: { type: String, require: true },
  configBy: { type: String, default: 'miru' },
  bindUser: { type: Schema.Types.ObjectId, ref: 'User' },
  socketStatus: { type: String, enum: ['online', 'offline' ], default: 'offline' },
}, { 
  createdAt: 'node_create_at',
  updatedAt: 'node_updated_at' 
});

DeviceSheme.pre('save', async function (next) {
  try {
    const resultPins = this.pins.map(valPin => {
      const pinDetail = diagram.esp8266.find(valDiagram => valPin.val in valDiagram);
      if(pinDetail) {
        return { gpio: Object.values(pinDetail)[0], ...valPin }
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
const NodeMCU = mongoose.model('NodeMCU', NodeMCUSheme); 

export default {
  Sensor,
  Device,
  NodeMCU,
} 
