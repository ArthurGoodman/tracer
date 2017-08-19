varying out vec4 fragColor;

uniform vec2 resolution;
uniform sampler2D image;

void main() {
    vec2 uv = gl_FragCoord.xy / resolution;
    vec3 color = texture(image, uv).xyz;

    color *= 0.5 + 0.5 * pow(16.0 * uv.x * uv.y * (1.0 - uv.x) * (1.0 - uv.y), 0.1);

    fragColor = vec4(color, 1.0);
}
