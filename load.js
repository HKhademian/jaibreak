let app = document.getElementById("app");
let ctx = app.getContext("2d");

function find_name_by_prefix(exports, prefix) {
    for (let name in exports) {
        if (name.startsWith(prefix)) {
            return exports[name];
        }
    }
    return null;
}

function make_environment(env) {
    return new Proxy(env, {
        get(target, prop, receiver) {
            if (!env.hasOwnProperty(prop)) {
                return (...args) => {console.error("NOT IMPLEMENTED: "+prop, args)}
            }
            return env[prop];
        }
    });
}

WebAssembly.instantiateStreaming(fetch('./main_fixed.wasm'), {
    "env": make_environment({
        "fill_rect_wasm": (x, y, w, h, r, g, b, a) => {
            r = Math.floor(r*255).toString(16).padStart(2, 0);
            g = Math.floor(g*255).toString(16).padStart(2, 0);
            b = Math.floor(b*255).toString(16).padStart(2, 0);
            a = Math.floor(a*255).toString(16).padStart(2, 0);
            ctx.fillStyle = '#'+r+g+b+a;
            ctx.fillRect(x, y, w, h);
        },
        "fabs": Math.abs,
        "powf": Math.pow,
        "random_get_zero_to_one": Math.random,
        "random_get_within_range": (a, b) => a + Math.random()*(b - a),
    })
}).then(wasmModule => {
    const NULL = 0;
    const init_state = find_name_by_prefix(wasmModule.instance.exports, "init_state_");
    const render = find_name_by_prefix(wasmModule.instance.exports, "render_");
    const update = find_name_by_prefix(wasmModule.instance.exports, "update_");
    const key_press = find_name_by_prefix(wasmModule.instance.exports, "key_press_");
    const key_release = find_name_by_prefix(wasmModule.instance.exports, "key_release_");
    init_state();

    let prev = null;
    function first(timestamp) {
        prev = timestamp;
        window.requestAnimationFrame(frame);
    }
    function frame(timestamp) {
        const dt = (timestamp - prev)*0.001;
        prev = timestamp;
        update(NULL, dt);
        ctx.fillStyle = '#181818';
        ctx.fillRect(0, 0, 1600, 900);
        render(NULL);
        window.requestAnimationFrame(frame);
    }
    window.requestAnimationFrame(first);

    document.addEventListener('keydown', (e) => key_press(NULL, e.keyCode));
    document.addEventListener('keyup', (e) => key_release(NULL, e.keyCode));
}).catch(console.error);