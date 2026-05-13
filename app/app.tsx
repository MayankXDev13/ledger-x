import "react-native-get-random-values";
import { Buffer } from "buffer";
import { EventEmitter } from "events";

(globalThis as { Buffer?: typeof Buffer }).Buffer = Buffer;
(globalThis as { EventEmitter?: typeof EventEmitter }).EventEmitter =
  EventEmitter;

export default function App() {
  return null;
}
