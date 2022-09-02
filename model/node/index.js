import mongoose from "mongoose";
const { Schema } = mongoose;
import diagram from "../../diagram/index.js";

/**
 * Define Schemas
 */

const SensorSampleShema = new Schema(
  {
    value: { type: Schema.Types.Mixed },
    bindSensor: { type: Schema.Types.ObjectId, ref: "Sensor" }
  },
  { timestamps: true }
);

const DevicePayloadShema = new Schema(
  {
    bindDevice: { type: Schema.Types.ObjectId, ref: "Device" },
    val: { type: String },
    gpio: { type: Number },
    status: { type: String },
    mode: { type: String },
    payload: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

const SensorShema = new Schema(
  {
    name: { type: String, require: true },
    desc: { type: String, default: "no-desc" },
    unit: { type: String, require: true },
    pin: { type: String },
    typeModel: { type: String, require: true },
    byNode: { type: Schema.Types.ObjectId, ref: "NodeMCU" },
  },
  { timestamps: true }
);

const DeviceShema = new Schema(
  {
    name: { type: String, require: true },
    desc: { type: String, default: "no-desc" },
    pins: [
      { 
        _id: false,
        val: { type: String },
        gpio: { type: Number }, 
      }
    ],
    unit: {
      type: String,
      enum: ["DIGITAL", "ANALOG", "ONE_WIRE"],
      default: "DIGITAL",
    },
    typeModel: { type: String, require: true },
    byNode: { type: Schema.Types.ObjectId, ref: "NodeMCU" },
  },
  { timestamps: true }
);

const NodeMCUShema = new Schema(
  {
    name: { type: String, require: true },
    desc: { type: String, default: "no-desc" },
    macAddress: { type: String },
    ipRemote: { type: String },
    typeModal: { type: String, require: true },
    configBy: { type: String, default: "miru" },
    bindUser: { type: Schema.Types.ObjectId, ref: "User" },
    socketStatus: {
      type: String,
      enum: ["online", "offline"],
      default: "offline",
    },
  },
  { timestamps: true }
);

const Sensor = mongoose.model("Sensor", SensorShema);
const Device = mongoose.model("Device", DeviceShema);
const NodeMCU = mongoose.model("NodeMCU", NodeMCUShema);
const SensorSample = mongoose.model("SensorSample", SensorSampleShema);
const DevicePayload = mongoose.model("DevicePayload", DevicePayloadShema);

export default {
  Sensor,
  Device,
  NodeMCU,
  SensorSample,
  DevicePayload
};
