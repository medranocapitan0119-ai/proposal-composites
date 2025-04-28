## Learning to use the polyfill

See https://github.com/ULL-ESIT-PL/babel-tanhauhau/discussions/41#discussioncomment-12939661 at ULL-ESIT-PL/babel-tanhauhau/discussions/41#


Lo primero, he instalado TypeScript para compilar el polyfill. He visto que hay un flag de node para quitar tipos. Aparece en el package.json en el script de `test` :
```
"test":  "node --test --experimental-strip-types"
```

La ayuda de node dice:

```
--test launch test runner on startup
--experimental-strip-types  Experimental type-stripping for TypeScript files.
```

También se podría usar `ts-node`. Entiendo que si se quiere probar con Typescript las dos opciones valen.

Pero yo lo hice para JavaScript. Mi `tsconfig.json`:
```json
{
    "compilerOptions": {
        "strict": true,
        "target": "ESNext",
        "module": "Preserve",
        "moduleDetection": "force",
        "allowImportingTsExtensions": true,
        "rewriteRelativeImportExtensions": true
    },
    "include": ["polyfill/**/*.ts"]
}
```

Lo importante es 
1. quitar el `noEmit` que viene en el repositorio original, que es lo que hace que no genere ficheros de salida de `.js`, y 
2. añadir la línea de `rewriteRelativeImportExtensions` para que cambie las extensiones de `.ts`, que se usan en los imports de los ficheros, a extensiones `.js`. (Rewrite .ts, .tsx, .mts, and .cts file extensions in relative import paths to their JavaScript equivalent in output files.)

Después de ejecutar `npx tsc` para compilar el polyfill, 

```
➜  proposal-composites git:(develop) ✗ npx tsc -p .
➜  proposal-composites git:(develop) ✗ 
➜  proposal-composites git:(develop) ✗ ls -tl polyfill/*.js
-rw-r--r--@ 1 casianorodriguezleon  staff  1073 28 abr 14:17 polyfill/index.test.js
-rw-r--r--@ 1 casianorodriguezleon  staff  1183 28 abr 14:17 polyfill/index.js
-rw-r--r--@ 1 casianorodriguezleon  staff  3897 28 abr 14:17 polyfill/composite.test.js
-rw-r--r--@ 1 casianorodriguezleon  staff  3211 28 abr 14:17 polyfill/collection-set.test.js
-rw-r--r--@ 1 casianorodriguezleon  staff  6940 28 abr 14:17 polyfill/collection-set.js
-rw-r--r--@ 1 casianorodriguezleon  staff  1423 28 abr 14:17 polyfill/collection-map.test.js
-rw-r--r--@ 1 casianorodriguezleon  staff  1583 28 abr 14:17 polyfill/collection-map.js
-rw-r--r--@ 1 casianorodriguezleon  staff  1692 28 abr 14:17 polyfill/collection-array.test.js
-rw-r--r--@ 1 casianorodriguezleon  staff  1469 28 abr 14:17 polyfill/collection-array.js
-rw-r--r--@ 1 casianorodriguezleon  staff  2764 28 abr 14:17 polyfill/composite.js
```
The entry point is the `polyfill/index.js` file:

```js
➜  proposal-composites git:(develop) ✗ cat polyfill/index.js 
import { Composite } from "./composite.js";
import { mapPrototypeMethods } from "./collection-map.js";
import { setPrototypeMethods } from "./collection-set.js";
import { arrayPrototypeMethods } from "./collection-array.js";
import { ownKeys } from "./internal/originals.js";
export { Composite, arrayPrototypeMethods, mapPrototypeMethods, setPrototypeMethods };
export function install(global) {
    global["Composite"] = Composite;
    const arrayMethods = ownKeys(arrayPrototypeMethods);
    for (let i = 0; i < arrayMethods.length; i++) {
        const method = arrayMethods[i];
        const impl = arrayPrototypeMethods[method];
        global["Array"].prototype[method] = impl;
    }
    const mapMethods = ownKeys(mapPrototypeMethods);
    for (let i = 0; i < mapMethods.length; i++) {
        const method = mapMethods[i];
        const impl = mapPrototypeMethods[method];
        global["Map"].prototype[method] = impl;
    }
    const setMethods = ownKeys(setPrototypeMethods);
    for (let i = 0; i < setMethods.length; i++) {
        const method = setMethods[i];
        const impl = setPrototypeMethods[method];
        global["Set"].prototype[method] = impl;
    }
}
```

hay que instalarlo usando la función `install` en el contexto en el que se va a instalar. 
Este es el ejemplo que probé:

```js
➜  proposal-composites git:(develop) ✗ cat examples/example.js
// Importar el polyfill e instalarlo en este contexto
import { install } from "../polyfill/index.js";
install(globalThis);

const pos1 = Composite({ x: 1, y: 4 });
const pos2 = Composite({ x: 1, y: 4 });
Composite.equal(pos1, pos2); // true

const positions = new Set(); // the standard ES Set
positions.add(pos1);
console.log(positions.has(pos1)); // true
console.log(positions.has(pos2)); // true
```

En `polyfill/index.test.ts` lo hace de otra manera creando un contexto nuevo con una librería de Node y llamando a su `this`, pero esta versión con el `globalThis` me funciona.

Ahora podemos ejecutarlo con `node`:

```
➜  proposal-composites git:(develop) ✗ node examples/example.js 
true
true
```