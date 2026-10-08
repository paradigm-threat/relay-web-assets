// src/wasm/relay_runtime_pkg/relay_runtime.js
function consume_render_requested() {
  const ret = wasm.consume_render_requested();
  return ret !== 0;
}
function get_client_live_phase() {
  const ret = wasm.get_client_live_phase();
  return ret >>> 0;
}
function get_current_theme_name() {
  let deferred1_0;
  let deferred1_1;
  try {
    const ret = wasm.get_current_theme_name();
    deferred1_0 = ret[0];
    deferred1_1 = ret[1];
    return getStringFromWasm0(ret[0], ret[1]);
  } finally {
    wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
  }
}
function get_injected_css() {
  let deferred1_0;
  let deferred1_1;
  try {
    const ret = wasm.get_injected_css();
    deferred1_0 = ret[0];
    deferred1_1 = ret[1];
    return getStringFromWasm0(ret[0], ret[1]);
  } finally {
    wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
  }
}
function get_themes() {
  let deferred1_0;
  let deferred1_1;
  try {
    const ret = wasm.get_themes();
    deferred1_0 = ret[0];
    deferred1_1 = ret[1];
    return getStringFromWasm0(ret[0], ret[1]);
  } finally {
    wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
  }
}
function invoke_handler(handler_id) {
  const ret = wasm.invoke_handler(handler_id);
  if (ret[1]) {
    throw takeFromExternrefTable0(ret[0]);
  }
}
function push_message_from_host(payload_json) {
  const ptr0 = passStringToWasm0(payload_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
  const len0 = WASM_VECTOR_LEN;
  wasm.push_message_from_host(ptr0, len0);
}
function run_hook_with_host(source, module_map_json, theme_yaml, hooks_manifest_json, file) {
  let deferred7_0;
  let deferred7_1;
  try {
    const ptr0 = passStringToWasm0(source, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(module_map_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    const ptr2 = passStringToWasm0(theme_yaml, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len2 = WASM_VECTOR_LEN;
    const ptr3 = passStringToWasm0(hooks_manifest_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len3 = WASM_VECTOR_LEN;
    const ptr4 = passStringToWasm0(file, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len4 = WASM_VECTOR_LEN;
    const ret = wasm.run_hook_with_host(ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3, ptr4, len4);
    var ptr6 = ret[0];
    var len6 = ret[1];
    if (ret[3]) {
      ptr6 = 0;
      len6 = 0;
      throw takeFromExternrefTable0(ret[2]);
    }
    deferred7_0 = ptr6;
    deferred7_1 = len6;
    return getStringFromWasm0(ptr6, len6);
  } finally {
    wasm.__wbindgen_free(deferred7_0, deferred7_1, 1);
  }
}
function set_client_live(live) {
  wasm.set_client_live(live);
}
function set_client_live_phase(phase) {
  wasm.set_client_live_phase(phase);
}
function set_theme_and_render(theme_name) {
  let deferred2_0;
  let deferred2_1;
  try {
    const ptr0 = passStringToWasm0(theme_name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.set_theme_and_render(ptr0, len0);
    deferred2_0 = ret[0];
    deferred2_1 = ret[1];
    return getStringFromWasm0(ret[0], ret[1]);
  } finally {
    wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
  }
}
function __wbg_get_imports() {
  const import0 = {
    __proto__: null,
    __wbg___wbindgen_debug_string_5398f5bb970e0daa: function(arg0, arg1) {
      const ret = debugString(arg1);
      const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
      const len1 = WASM_VECTOR_LEN;
      getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
      getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    },
    __wbg___wbindgen_is_function_3c846841762788c1: function(arg0) {
      const ret = typeof arg0 === "function";
      return ret;
    },
    __wbg___wbindgen_is_null_0b605fc6b167c56f: function(arg0) {
      const ret = arg0 === null;
      return ret;
    },
    __wbg___wbindgen_is_undefined_52709e72fb9f179c: function(arg0) {
      const ret = arg0 === void 0;
      return ret;
    },
    __wbg___wbindgen_string_get_395e606bd0ee4427: function(arg0, arg1) {
      const obj = arg1;
      const ret = typeof obj === "string" ? obj : void 0;
      var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
      var len1 = WASM_VECTOR_LEN;
      getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
      getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    },
    __wbg___wbindgen_throw_6ddd609b62940d55: function(arg0, arg1) {
      throw new Error(getStringFromWasm0(arg0, arg1));
    },
    __wbg__wbg_cb_unref_6b5b6b8576d35cb1: function(arg0) {
      arg0._wbg_cb_unref();
    },
    __wbg_appendChild_8cb157b6ec5612a6: function() {
      return handleError(function(arg0, arg1) {
        const ret = arg0.appendChild(arg1);
        return ret;
      }, arguments);
    },
    __wbg_body_5eb99e7257e5ae34: function(arg0) {
      const ret = arg0.body;
      return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    },
    __wbg_bottom_bfd7fcb3cf1632f0: function(arg0) {
      const ret = arg0.bottom;
      return ret;
    },
    __wbg_call_dcc2662fa17a72cf: function() {
      return handleError(function(arg0, arg1, arg2, arg3) {
        const ret = arg0.call(arg1, arg2, arg3);
        return ret;
      }, arguments);
    },
    __wbg_clearInterval_1cf7b4d7d9952d6e: function(arg0, arg1) {
      arg0.clearInterval(arg1);
    },
    __wbg_createElement_9b0aab265c549ded: function() {
      return handleError(function(arg0, arg1, arg2) {
        const ret = arg0.createElement(getStringFromWasm0(arg1, arg2));
        return ret;
      }, arguments);
    },
    __wbg_documentElement_bef4a2d2289074bb: function(arg0) {
      const ret = arg0.documentElement;
      return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    },
    __wbg_document_c0320cd4183c6d9b: function(arg0) {
      const ret = arg0.document;
      return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    },
    __wbg_error_77f84ad1c22e66ee: function(arg0, arg1) {
      console.error(getStringFromWasm0(arg0, arg1));
    },
    __wbg_error_a6fa202b58aa1cd3: function(arg0, arg1) {
      let deferred0_0;
      let deferred0_1;
      try {
        deferred0_0 = arg0;
        deferred0_1 = arg1;
        console.error(getStringFromWasm0(arg0, arg1));
      } finally {
        wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
      }
    },
    __wbg_getAttribute_cf830fef39b6ba0e: function(arg0, arg1, arg2, arg3) {
      const ret = arg1.getAttribute(getStringFromWasm0(arg2, arg3));
      var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
      var len1 = WASM_VECTOR_LEN;
      getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
      getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    },
    __wbg_getBoundingClientRect_b236f2e393fd0e7a: function(arg0) {
      const ret = arg0.getBoundingClientRect();
      return ret;
    },
    __wbg_getElementById_d1f25d287b19a833: function(arg0, arg1, arg2) {
      const ret = arg0.getElementById(getStringFromWasm0(arg1, arg2));
      return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    },
    __wbg_get_3ef1eba1850ade27: function() {
      return handleError(function(arg0, arg1) {
        const ret = Reflect.get(arg0, arg1);
        return ret;
      }, arguments);
    },
    __wbg_hash_d4a10bb21e6ca48e: function() {
      return handleError(function(arg0, arg1) {
        const ret = arg1.hash;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
      }, arguments);
    },
    __wbg_height_75b0d10baf97e535: function(arg0) {
      const ret = arg0.height;
      return ret;
    },
    __wbg_id_491c6437a748ea9f: function(arg0, arg1) {
      const ret = arg1.id;
      const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
      const len1 = WASM_VECTOR_LEN;
      getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
      getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    },
    __wbg_instanceof_Element_7f177ac0337279af: function(arg0) {
      let result;
      try {
        result = arg0 instanceof Element;
      } catch (_) {
        result = false;
      }
      const ret = result;
      return ret;
    },
    __wbg_instanceof_Window_23e677d2c6843922: function(arg0) {
      let result;
      try {
        result = arg0 instanceof Window;
      } catch (_) {
        result = false;
      }
      const ret = result;
      return ret;
    },
    __wbg_item_e98a1fe90d4c2720: function(arg0, arg1) {
      const ret = arg0.item(arg1 >>> 0);
      return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    },
    __wbg_left_0050d4abe2736ee9: function(arg0) {
      const ret = arg0.left;
      return ret;
    },
    __wbg_length_6d31ca02e78204b5: function(arg0) {
      const ret = arg0.length;
      return ret;
    },
    __wbg_location_bb196e19ef6c7fa6: function(arg0) {
      const ret = arg0.location;
      return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    },
    __wbg_log_0dd87087bf840aa4: function(arg0, arg1) {
      console.log(getStringFromWasm0(arg0, arg1));
    },
    __wbg_new_227d7c05414eb861: function() {
      const ret = new Error();
      return ret;
    },
    __wbg_new_ab79df5bd7c26067: function() {
      const ret = new Object();
      return ret;
    },
    __wbg_now_7523ee0cff6734c1: function() {
      const ret = performance.now();
      return ret;
    },
    __wbg_parse_e9eddd2a82c706eb: function() {
      return handleError(function(arg0, arg1) {
        const ret = JSON.parse(getStringFromWasm0(arg0, arg1));
        return ret;
      }, arguments);
    },
    __wbg_postMessage_149575509e02c89c: function() {
      return handleError(function(arg0, arg1, arg2, arg3) {
        arg0.postMessage(arg1, getStringFromWasm0(arg2, arg3));
      }, arguments);
    },
    __wbg_querySelectorAll_ccbf0696a1c6fed8: function() {
      return handleError(function(arg0, arg1, arg2) {
        const ret = arg0.querySelectorAll(getStringFromWasm0(arg1, arg2));
        return ret;
      }, arguments);
    },
    __wbg_querySelector_46ff1b81410aebea: function() {
      return handleError(function(arg0, arg1, arg2) {
        const ret = arg0.querySelector(getStringFromWasm0(arg1, arg2));
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
      }, arguments);
    },
    __wbg_right_ad93e95b5e30b7ff: function(arg0) {
      const ret = arg0.right;
      return ret;
    },
    __wbg_scrollIntoView_ac3346b6ac9b4e13: function(arg0) {
      arg0.scrollIntoView();
    },
    __wbg_setAttribute_f20d3b966749ab64: function() {
      return handleError(function(arg0, arg1, arg2, arg3, arg4) {
        arg0.setAttribute(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
      }, arguments);
    },
    __wbg_setInterval_2cc6fda2bedb96bc: function() {
      return handleError(function(arg0, arg1, arg2) {
        const ret = arg0.setInterval(arg1, arg2);
        return ret;
      }, arguments);
    },
    __wbg_set_7eaa4f96924fd6b3: function() {
      return handleError(function(arg0, arg1, arg2) {
        const ret = Reflect.set(arg0, arg1, arg2);
        return ret;
      }, arguments);
    },
    __wbg_stack_3b0d974bbf31e44f: function(arg0, arg1) {
      const ret = arg1.stack;
      const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
      const len1 = WASM_VECTOR_LEN;
      getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
      getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    },
    __wbg_static_accessor_GLOBAL_8adb955bd33fac2f: function() {
      const ret = typeof global === "undefined" ? null : global;
      return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    },
    __wbg_static_accessor_GLOBAL_THIS_ad356e0db91c7913: function() {
      const ret = typeof globalThis === "undefined" ? null : globalThis;
      return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    },
    __wbg_static_accessor_SELF_f207c857566db248: function() {
      const ret = typeof self === "undefined" ? null : self;
      return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    },
    __wbg_static_accessor_WINDOW_bb9f1ba69d61b386: function() {
      const ret = typeof window === "undefined" ? null : window;
      return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    },
    __wbg_stringify_5ae93966a84901ac: function() {
      return handleError(function(arg0) {
        const ret = JSON.stringify(arg0);
        return ret;
      }, arguments);
    },
    __wbg_tagName_3bd06789ca771c23: function(arg0, arg1) {
      const ret = arg1.tagName;
      const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
      const len1 = WASM_VECTOR_LEN;
      getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
      getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    },
    __wbg_textContent_75b4506705c8c793: function(arg0, arg1) {
      const ret = arg1.textContent;
      var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
      var len1 = WASM_VECTOR_LEN;
      getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
      getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    },
    __wbg_top_378559f0b38a1038: function(arg0) {
      const ret = arg0.top;
      return ret;
    },
    __wbg_warn_12dba41eae207dc7: function(arg0, arg1) {
      console.warn(getStringFromWasm0(arg0, arg1));
    },
    __wbg_width_f933723cb0daf368: function(arg0) {
      const ret = arg0.width;
      return ret;
    },
    __wbindgen_cast_0000000000000001: function(arg0, arg1) {
      const ret = makeMutClosure(arg0, arg1, wasm.wasm_bindgen__closure__destroy__h70836fd6b4c627df, wasm_bindgen__convert__closures_____invoke__h50d33f36c27ea276);
      return ret;
    },
    __wbindgen_cast_0000000000000002: function(arg0, arg1) {
      const ret = getStringFromWasm0(arg0, arg1);
      return ret;
    },
    __wbindgen_init_externref_table: function() {
      const table = wasm.__wbindgen_externrefs;
      const offset = table.grow(4);
      table.set(0, void 0);
      table.set(offset + 0, void 0);
      table.set(offset + 1, null);
      table.set(offset + 2, true);
      table.set(offset + 3, false);
    }
  };
  return {
    __proto__: null,
    "./relay_runtime_bg.js": import0
  };
}
function wasm_bindgen__convert__closures_____invoke__h50d33f36c27ea276(arg0, arg1) {
  wasm.wasm_bindgen__convert__closures_____invoke__h50d33f36c27ea276(arg0, arg1);
}
function addToExternrefTable0(obj) {
  const idx = wasm.__externref_table_alloc();
  wasm.__wbindgen_externrefs.set(idx, obj);
  return idx;
}
var CLOSURE_DTORS = typeof FinalizationRegistry === "undefined" ? { register: () => {
}, unregister: () => {
} } : new FinalizationRegistry((state) => state.dtor(state.a, state.b));
function debugString(val) {
  const type = typeof val;
  if (type == "number" || type == "boolean" || val == null) {
    return `${val}`;
  }
  if (type == "string") {
    return `"${val}"`;
  }
  if (type == "symbol") {
    const description = val.description;
    if (description == null) {
      return "Symbol";
    } else {
      return `Symbol(${description})`;
    }
  }
  if (type == "function") {
    const name = val.name;
    if (typeof name == "string" && name.length > 0) {
      return `Function(${name})`;
    } else {
      return "Function";
    }
  }
  if (Array.isArray(val)) {
    const length = val.length;
    let debug = "[";
    if (length > 0) {
      debug += debugString(val[0]);
    }
    for (let i = 1; i < length; i++) {
      debug += ", " + debugString(val[i]);
    }
    debug += "]";
    return debug;
  }
  const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
  let className;
  if (builtInMatches && builtInMatches.length > 1) {
    className = builtInMatches[1];
  } else {
    return toString.call(val);
  }
  if (className == "Object") {
    try {
      return "Object(" + JSON.stringify(val) + ")";
    } catch (_) {
      return "Object";
    }
  }
  if (val instanceof Error) {
    return `${val.name}: ${val.message}
${val.stack}`;
  }
  return className;
}
var cachedDataViewMemory0 = null;
function getDataViewMemory0() {
  if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || cachedDataViewMemory0.buffer.detached === void 0 && cachedDataViewMemory0.buffer !== wasm.memory.buffer) {
    cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
  }
  return cachedDataViewMemory0;
}
function getStringFromWasm0(ptr, len) {
  ptr = ptr >>> 0;
  return decodeText(ptr, len);
}
var cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
  if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
    cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
  }
  return cachedUint8ArrayMemory0;
}
function handleError(f, args) {
  try {
    return f.apply(this, args);
  } catch (e) {
    const idx = addToExternrefTable0(e);
    wasm.__wbindgen_exn_store(idx);
  }
}
function isLikeNone(x) {
  return x === void 0 || x === null;
}
function makeMutClosure(arg0, arg1, dtor, f) {
  const state = { a: arg0, b: arg1, cnt: 1, dtor };
  const real = (...args) => {
    state.cnt++;
    const a = state.a;
    state.a = 0;
    try {
      return f(a, state.b, ...args);
    } finally {
      state.a = a;
      real._wbg_cb_unref();
    }
  };
  real._wbg_cb_unref = () => {
    if (--state.cnt === 0) {
      state.dtor(state.a, state.b);
      state.a = 0;
      CLOSURE_DTORS.unregister(state);
    }
  };
  CLOSURE_DTORS.register(real, state, state);
  return real;
}
function passStringToWasm0(arg, malloc, realloc) {
  if (realloc === void 0) {
    const buf = cachedTextEncoder.encode(arg);
    const ptr2 = malloc(buf.length, 1) >>> 0;
    getUint8ArrayMemory0().subarray(ptr2, ptr2 + buf.length).set(buf);
    WASM_VECTOR_LEN = buf.length;
    return ptr2;
  }
  let len = arg.length;
  let ptr = malloc(len, 1) >>> 0;
  const mem = getUint8ArrayMemory0();
  let offset = 0;
  for (; offset < len; offset++) {
    const code = arg.charCodeAt(offset);
    if (code > 127) break;
    mem[ptr + offset] = code;
  }
  if (offset !== len) {
    if (offset !== 0) {
      arg = arg.slice(offset);
    }
    ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
    const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
    const ret = cachedTextEncoder.encodeInto(arg, view);
    offset += ret.written;
    ptr = realloc(ptr, len, offset, 1) >>> 0;
  }
  WASM_VECTOR_LEN = offset;
  return ptr;
}
function takeFromExternrefTable0(idx) {
  const value = wasm.__wbindgen_externrefs.get(idx);
  wasm.__externref_table_dealloc(idx);
  return value;
}
var cachedTextDecoder = new TextDecoder("utf-8", { ignoreBOM: true, fatal: true });
cachedTextDecoder.decode();
var MAX_SAFARI_DECODE_BYTES = 2146435072;
var numBytesDecoded = 0;
function decodeText(ptr, len) {
  numBytesDecoded += len;
  if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
    cachedTextDecoder = new TextDecoder("utf-8", { ignoreBOM: true, fatal: true });
    cachedTextDecoder.decode();
    numBytesDecoded = len;
  }
  return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}
var cachedTextEncoder = new TextEncoder();
if (!("encodeInto" in cachedTextEncoder)) {
  cachedTextEncoder.encodeInto = function(arg, view) {
    const buf = cachedTextEncoder.encode(arg);
    view.set(buf);
    return {
      read: arg.length,
      written: buf.length
    };
  };
}
var WASM_VECTOR_LEN = 0;
var wasmModule;
var wasm;
function __wbg_finalize_init(instance, module) {
  wasm = instance.exports;
  wasmModule = module;
  cachedDataViewMemory0 = null;
  cachedUint8ArrayMemory0 = null;
  wasm.__wbindgen_start();
  return wasm;
}
async function __wbg_load(module, imports) {
  if (typeof Response === "function" && module instanceof Response) {
    if (typeof WebAssembly.instantiateStreaming === "function") {
      try {
        return await WebAssembly.instantiateStreaming(module, imports);
      } catch (e) {
        const validResponse = module.ok && expectedResponseType(module.type);
        if (validResponse && module.headers.get("Content-Type") !== "application/wasm") {
          console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);
        } else {
          throw e;
        }
      }
    }
    const bytes = await module.arrayBuffer();
    return await WebAssembly.instantiate(bytes, imports);
  } else {
    const instance = await WebAssembly.instantiate(module, imports);
    if (instance instanceof WebAssembly.Instance) {
      return { instance, module };
    } else {
      return instance;
    }
  }
  function expectedResponseType(type) {
    switch (type) {
      case "basic":
      case "cors":
      case "default":
        return true;
    }
    return false;
  }
}
async function __wbg_init(module_or_path) {
  if (wasm !== void 0) return wasm;
  if (module_or_path !== void 0) {
    if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
      ({ module_or_path } = module_or_path);
    } else {
      console.warn("using deprecated parameters for the initialization function; pass a single object instead");
    }
  }
  if (module_or_path === void 0) {
    module_or_path = new URL("relay_runtime_bg.wasm", import.meta.url);
  }
  const imports = __wbg_get_imports();
  if (typeof module_or_path === "string" || typeof Request === "function" && module_or_path instanceof Request || typeof URL === "function" && module_or_path instanceof URL) {
    module_or_path = fetch(module_or_path);
  }
  const { instance, module } = await __wbg_load(await module_or_path, imports);
  return __wbg_finalize_init(instance, module);
}

export {
  consume_render_requested,
  get_client_live_phase,
  get_current_theme_name,
  get_injected_css,
  get_themes,
  invoke_handler,
  push_message_from_host,
  run_hook_with_host,
  set_client_live,
  set_client_live_phase,
  set_theme_and_render,
  __wbg_init
};
//# sourceMappingURL=chunk-66JIB6FZ.js.map
