// Importar el polyfill e instalarlo en este contexto
import { install } from "../polyfill/index.js";
install(globalThis); // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/globalThis

const pos1 = Composite({ x: 1, y: 4 });
const pos2 = Composite({ x: 1, y: 4 });
Composite.equal(pos1, pos2); // true

const positions = new Set(); // the standard ES Set
positions.add(pos1);
console.log(positions.has(pos1)); // true
console.log(positions.has(pos2)); // true