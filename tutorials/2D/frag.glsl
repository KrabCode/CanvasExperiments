precision highp float;

uniform vec2 resolution;
uniform float time;

void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    float t = time;
    vec3 col = 0.5 + 0.5*cos(t+uv.xyx+vec3(0,2,4));

    gl_FragColor = vec4(col, 1.0);
}