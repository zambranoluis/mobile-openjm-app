import { defineConfig } from 'eslint/config';
import expo from 'eslint-config-expo/flat.js';
export default defineConfig([expo,{ignores:['dist/**','workspace/**']},{files:['scripts/**/*.mjs','tests/unit/**/*.mjs'],rules:{'no-undef':'off'}}]);
