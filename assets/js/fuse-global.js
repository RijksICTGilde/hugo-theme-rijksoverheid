// Fuse levert geen browserbundel meer, alleen ESM en CommonJS. js.Build
// (esbuild) maakt hier een gewoon script van dat Fuse op window zet.
import Fuse from '../lib/fuse/fuse.min.mjs';

window.Fuse = Fuse;
