/* Shared by scrobbler.html and callback.html (this file lives on GitHub Pages). */
window.LFM = (function () {
    // ----------------------------- CONFIG -----------------------------
    var API_KEY     = "c633d72e63d97303e02d9dca2c4e5dc8";
    var API_SECRET  = "dde421fd7a3676130860bbf057af6dd2";
    var SITE_ORIGIN = "https://kakuyamii.neocities.org";   // your Neocities site, no trailing slash
    // ------------------------------------------------------------------

    var API_ROOT = "https://ws.audioscrobbler.com/2.0/";

    // ---------- MD5 (last.fm requires signed requests) ----------
    function md5(str) {
        var bytes = new TextEncoder().encode(str);
        var S = [7,12,17,22,7,12,17,22,7,12,17,22,7,12,17,22,
                 5,9,14,20,5,9,14,20,5,9,14,20,5,9,14,20,
                 4,11,16,23,4,11,16,23,4,11,16,23,4,11,16,23,
                 6,10,15,21,6,10,15,21,6,10,15,21,6,10,15,21];
        var K = [], i;
        for (i = 0; i < 64; i++) K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296) | 0;

        function add(x, y) { return (x + y) | 0; }
        function rol(n, c) { return (n << c) | (n >>> (32 - c)); }

        var len = bytes.length;
        var total = (((len + 8) >> 6) + 1) * 64;
        var buf = new Uint8Array(total);
        buf.set(bytes);
        buf[len] = 0x80;
        var dv = new DataView(buf.buffer);
        var bits = len * 8;
        dv.setUint32(total - 8, bits >>> 0, true);
        dv.setUint32(total - 4, Math.floor(bits / 4294967296), true);

        var a0 = 0x67452301 | 0, b0 = 0xefcdab89 | 0, c0 = 0x98badcfe | 0, d0 = 0x10325476 | 0;

        for (var off = 0; off < total; off += 64) {
            var M = [];
            for (var j = 0; j < 16; j++) M[j] = dv.getUint32(off + j * 4, true) | 0;
            var A = a0, B = b0, C = c0, D = d0, F, g;
            for (i = 0; i < 64; i++) {
                if (i < 16)      { F = (B & C) | (~B & D);  g = i; }
                else if (i < 32) { F = (D & B) | (~D & C);  g = (5 * i + 1) % 16; }
                else if (i < 48) { F = B ^ C ^ D;           g = (3 * i + 5) % 16; }
                else             { F = C ^ (B | ~D);        g = (7 * i) % 16; }
                F = add(add(F, A), add(K[i], M[g]));
                A = D; D = C; C = B;
                B = add(B, rol(F, S[i]));
            }
            a0 = add(a0, A); b0 = add(b0, B); c0 = add(c0, C); d0 = add(d0, D);
        }

        var out = "";
        [a0, b0, c0, d0].forEach(function (w) {
            for (var k = 0; k < 4; k++) out += ((w >>> (k * 8)) & 255).toString(16).padStart(2, "0");
        });
        return out;
    }

    // ---------- API calls ----------
    function sign(p) {
        var s = "";
        Object.keys(p)
            .filter(function (k) { return k !== "format" && k !== "callback"; })
            .sort()
            .forEach(function (k) { s += k + p[k]; });
        return md5(s + API_SECRET);
    }

    function api(params, post) {
        var p = {};
        Object.keys(params).forEach(function (k) { p[k] = String(params[k]); });
        p.api_key = API_KEY;
        p.api_sig = sign(p);
        p.format = "json";
        var body = new URLSearchParams(p).toString();
        var req = post
            ? fetch(API_ROOT, {
                  method: "POST",
                  headers: { "Content-Type": "application/x-www-form-urlencoded" },
                  body: body
              })
            : fetch(API_ROOT + "?" + body);
        return req.then(function (r) { return r.json(); });
    }

    return { API_KEY: API_KEY, SITE_ORIGIN: SITE_ORIGIN, api: api, md5: md5 };
})();
