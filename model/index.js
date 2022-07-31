import mongoose from 'mongoose';
const { Schema } = mongoose;

/**
 * Schemas
 */

const Sensor = new Schema({
  name:  { type: String, require: true },
  desc: { type: String, default: 'no-desc' },
  value: { type: Number, default: null },
  unit: { type: String, require: true },
  typeModel: { type: String },
  byNode: { type: Schema.Types.ObjectId, ref: 'NodeESP8266' }
});

const NodeESP8266 = new Schema({
  name: { type: String, default: 'ESP8266' },
  desc: { type: String, default: 'no-desc' },
  macAddress: { type: String, require: true },
  ipRemote: { type: String, require: true },
  typeModel: { type: String },
  configBy: { type: String, default: 'miru' },
  sensors: [{ type: Schema.Types.ObjectId, ref: 'Sensor' }]
});

const SensorModel = mongoose.model('Sensor', Sensor); 
const NodeESP8266Model = mongoose.model('NodeESP8266', NodeESP8266); 

export {
  SensorModel,
  NodeESP8266Model,
}
