#version 120

varying out vec4 fragColor;

uniform vec2 resolution;
uniform mat4 camera;

//------------------------------------------------------------------

float sdPlane( vec3 p )
{
    return abs(p.y);
}

float sdSphere( vec3 p, float s )
{
    return length(p)-s;
}

float sdBox( vec3 p, vec3 b )
{
    vec3 d = abs(p) - b;
    return min(max(d.x,max(d.y,d.z)),0.0) + length(max(d,0.0));
}

float sdEllipsoid( vec3 p, vec3 r )
{
    return (length( p/r ) - 1.0) * min(min(r.x,r.y),r.z);
}

float udRoundBox( vec3 p, vec3 b, float r )
{
    return length(max(abs(p)-b,0.0))-r;
}

float sdTorus( vec3 p, vec2 t )
{
    return length( vec2(length(p.xz)-t.x,p.y) )-t.y;
}

float sdHexPrism( vec3 p, vec2 h )
{
    vec3 q = abs(p);
#if 0
    return max(q.z-h.y,max((q.x*0.866025+q.y*0.5),q.y)-h.x);
#else
    float d1 = q.z-h.y;
    float d2 = max((q.x*0.866025+q.y*0.5),q.y)-h.x;
    return length(max(vec2(d1,d2),0.0)) + min(max(d1,d2), 0.);
#endif
}

float sdCapsule( vec3 p, vec3 a, vec3 b, float r )
{
    vec3 pa = p-a, ba = b-a;
    float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
    return length( pa - ba*h ) - r;
}

float sdTriPrism( vec3 p, vec2 h )
{
    vec3 q = abs(p);
#if 0
    return max(q.z-h.y,max(q.x*0.866025+p.y*0.5,-p.y)-h.x*0.5);
#else
    float d1 = q.z-h.y;
    float d2 = max(q.x*0.866025+p.y*0.5,-p.y)-h.x*0.5;
    return length(max(vec2(d1,d2),0.0)) + min(max(d1,d2), 0.);
#endif
}

float sdCylinder( vec3 p, vec2 h )
{
  vec2 d = abs(vec2(length(p.xz),p.y)) - h;
  return min(max(d.x,d.y),0.0) + length(max(d,0.0));
}

float sdCone( vec3 p, vec3 c )
{
    vec2 q = vec2( length(p.xz), p.y );
    float d1 = -q.y-c.z;
    float d2 = max( dot(q,c.xy), q.y);
    return length(max(vec2(d1,d2),0.0)) + min(max(d1,d2), 0.);
}

float sdConeSection( vec3 p, float h, float r1, float r2 )
{
    float d1 = -p.y - h;
    float q = p.y - h;
    float si = 0.5*(r1-r2)/h;
    float d2 = max( sqrt( dot(p.xz,p.xz)*(1.0-si*si)) + q*si - r2, q );
    return length(max(vec2(d1,d2),0.0)) + min(max(d1,d2), 0.);
}

float sdPryamid4(vec3 p, vec3 h ) // h = { cos a, sin a, height }
{
    // Tetrahedron = Octahedron - Cube
    float box = sdBox( p - vec3(0,-2.0*h.z,0), vec3(2.0*h.z) );
 
    float d = 0.0;
    d = max( d, abs( dot(p, vec3( -h.x, h.y, 0 )) ));
    d = max( d, abs( dot(p, vec3(  h.x, h.y, 0 )) ));
    d = max( d, abs( dot(p, vec3(  0, h.y, h.x )) ));
    d = max( d, abs( dot(p, vec3(  0, h.y,-h.x )) ));
    float octa = d - h.z;
    return max(-box,octa); // Subtraction
 }

float length2( vec2 p )
{
    return sqrt( p.x*p.x + p.y*p.y );
}

float length6( vec2 p )
{
    p = p*p*p; p = p*p;
    return pow( p.x + p.y, 1.0/6.0 );
}

float length8( vec2 p )
{
    p = p*p; p = p*p; p = p*p;
    return pow( p.x + p.y, 1.0/8.0 );
}

float sdTorus82( vec3 p, vec2 t )
{
    vec2 q = vec2(length2(p.xz)-t.x,p.y);
    return length8(q)-t.y;
}

float sdTorus88( vec3 p, vec2 t )
{
    vec2 q = vec2(length8(p.xz)-t.x,p.y);
    return length8(q)-t.y;
}

float sdCylinder6( vec3 p, vec2 h )
{
    return max( length6(p.xz)-h.x, abs(p.y)-h.y );
}

//------------------------------------------------------------------

float opS( float d1, float d2 )
{
    return max(-d2,d1);
}

vec2 opU( vec2 d1, vec2 d2 )
{
    return (d1.x<d2.x) ? d1 : d2;
}

vec3 opRep( vec3 p, vec3 c )
{
    return mod(p,c)-0.5*c;
}

vec3 opTwist( vec3 p )
{
    float  c = cos(10.0*p.y+10.0);
    float  s = sin(10.0*p.y+10.0);
    mat2   m = mat2(c,-s,s,c);
    return vec3(m*p.xz,p.y);
}

//------------------------------------------------------------------

vec2 map(vec3 pos) {
    vec2 res = opU( vec2( sdPlane(     pos), 1.0 ),
                    vec2( sdSphere(    pos-vec3( 0.0,0.25, 0.0), 0.25 ), 46.9 ) );
    res = opU( res, vec2( sdBox(       pos-vec3( 1.0,0.25, 0.0), vec3(0.25) ), 3.0 ) );
    res = opU( res, vec2( udRoundBox(  pos-vec3( 1.0,0.25, 1.0), vec3(0.15), 0.1 ), 41.0 ) );
    res = opU( res, vec2( sdTorus(     pos-vec3( 0.0,0.25, 1.0), vec2(0.20,0.05) ), 25.0 ) );
    res = opU( res, vec2( sdCapsule(   pos,vec3(-1.3,0.10,-0.1), vec3(-0.8,0.50,0.2), 0.1  ), 31.9 ) );
    res = opU( res, vec2( sdTriPrism(  pos-vec3(-1.0,0.25,-1.0), vec2(0.25,0.05) ),43.5 ) );
    res = opU( res, vec2( sdCylinder(  pos-vec3( 1.0,0.30,-1.0), vec2(0.1,0.2) ), 8.0 ) );
    res = opU( res, vec2( sdCone(      pos-vec3( 0.0,0.50,-1.0), vec3(0.8,0.6,0.3) ), 55.0 ) );
    res = opU( res, vec2( sdTorus82(   pos-vec3( 0.0,0.25, 2.0), vec2(0.20,0.05) ),50.0 ) );
    res = opU( res, vec2( sdTorus88(   pos-vec3(-1.0,0.25, 2.0), vec2(0.20,0.05) ),43.0 ) );
    res = opU( res, vec2( sdCylinder6( pos-vec3( 1.0,0.30, 2.0), vec2(0.1,0.2) ), 12.0 ) );
    res = opU( res, vec2( sdHexPrism(  pos-vec3(-1.0,0.20, 1.0), vec2(0.25,0.05) ),17.0 ) );
    res = opU( res, vec2( sdPryamid4(  pos-vec3(-1.0,0.15,-2.0), vec3(0.8,0.6,0.25) ),37.0 ) );
    res = opU( res, vec2( opS( udRoundBox(  pos-vec3(-2.0,0.2, 1.0), vec3(0.15),0.05),
                               sdSphere(    pos-vec3(-2.0,0.2, 1.0), 0.25)), 13.0 ) );
    res = opU( res, vec2( opS( sdTorus82(  pos-vec3(-2.0,0.2, 0.0), vec2(0.20,0.1)),
                               sdCylinder(  opRep( vec3(atan(pos.x+2.0,pos.z)/6.2831, pos.y, 0.02+0.5*length(pos-vec3(-2.0,0.2, 0.0))), vec3(0.05,1.0,0.05)), vec2(0.02,0.6))), 51.0 ) );
    res = opU( res, vec2( 0.5*sdSphere(    pos-vec3(-2.0,0.25,-1.0), 0.2 ) + 0.03*sin(50.0*pos.x)*sin(50.0*pos.y)*sin(50.0*pos.z), 65.0 ) );
    res = opU( res, vec2( 0.5*sdTorus( opTwist(pos-vec3(-2.0,0.25, 2.0)),vec2(0.20,0.05)), 46.7 ) );
    res = opU( res, vec2( sdConeSection( pos-vec3( 0.0,0.35,-2.0), 0.15, 0.2, 0.1 ), 13.67 ) );
    res = opU( res, vec2( sdEllipsoid( pos-vec3( 1.0,0.35,-2.0), vec3(0.15, 0.2, 0.05) ), 43.17 ) );
        
    return res;
}

vec2 castRay(vec3 origin, vec3 direction) {
    const float minDist = 0.0;
    const float maxDist = 20.0;
    const int maxIt = 128;

    float distance = minDist;
    float material = -1.0;

    for (int i = 0; i < maxIt; i++) {
        float precis = 0.0005 * distance;

        vec2 result = map(origin + direction * distance);

        if (result.x < precis || distance > maxDist)
            break;

        distance += result.x;
        material = result.y;
    }

    if (distance > maxDist)
        material = -1.0;

    return vec2(distance, material);
}

float shadow(vec3 origin, vec3 direction, float minDist, float maxDist, float k) {
    const int maxIt = 128;

    float hit = 1.0;
    float distance = minDist;

    for (int i = 0; i < maxIt; i++) {
        float h = map(origin + direction * distance).x;

        if (h < 0.0001)
            return 0.0;

        distance += h;
        hit = min(hit, k * h / distance);

        if (distance >= maxDist)
            break;
    }

    return clamp(hit, 0.0, 1.0);
}

vec3 calcNormal(vec3 p) {
    vec3 eps = vec3(0.001, 0.0, 0.0);
    vec3 normal = vec3(map(p + eps.xyy).x - map(p - eps.xyy).x,
                       map(p + eps.yxy).x - map(p - eps.yxy).x,
                       map(p + eps.yyx).x - map(p - eps.yyx).x);

    return normalize(normal);
}

float calcAmbientOcclusion(vec3 p, vec3 normal) {
    const int maxIt = 5;

    float occlusion = 0.0;
    float scale = 1.0;

    for (int i = 0; i < maxIt; i++) {
        float hr = 0.01 + 0.12 * float(i) / 4.0;
        vec3 aoPos = normal * hr + p;
        float dd = map(aoPos).x;
        occlusion += -(dd - hr) * scale;
        scale *= 0.95;
    }

    return clamp(1.0 - 3.0 * occlusion, 0.0, 1.0);
}

vec3 render(vec3 origin, vec3 direction) {
    vec3 color = vec3(0.7, 0.9, 1.0) + direction.y * 0.8;

    vec2 result = castRay(origin, direction);
    float distance = result.x;
    float material = result.y;

    if (material > -0.5) {
        vec3 pos = origin + distance * direction;
        vec3 normal = calcNormal(pos);
        vec3 reflection = reflect(direction, normal);
        
        color = 0.45 + 0.35 * sin(vec3(0.05, 0.08, 0.10) * (material - 1.0));
        if (material < 1.5) {
            float f = mod(floor(5.0 * pos.z) + floor(5.0 * pos.x), 2.0);
            color = 0.3 + 0.1 * f * vec3(1.0);
        }

        vec3 light = normalize(vec3(-0.4, 0.7, -0.6));

        float occlusion = calcAmbientOcclusion(pos, normal);
        float ambient = clamp(0.5 + 0.5 * normal.y, 0.0, 1.0);
        float diffuse = clamp(dot(normal, light), 0.0, 1.0);
        float back = clamp(dot(normal, normalize(vec3(-light.x, 0.0, -light.z))), 0.0, 1.0) * clamp(1.0 - pos.y, 0.0, 1.0);
        float sky = smoothstep(-0.1, 0.1, reflection.y);
        float fresnel = pow(clamp(1.0 + dot(normal, direction), 0.0, 1.0), 2.0);
        float specular = pow(clamp(dot(reflection, light), 0.0, 1.0), 16.0);

        diffuse *= shadow( pos, light, 0.02, 5, 16);
        sky *= shadow( pos, reflection, 0.02, 5, 16);

        vec3 lin = vec3(0.0);
        lin += 1.30 * diffuse * vec3(1.00, 0.80, 0.55);
        lin += 2.00 * specular * vec3(1.00, 0.90, 0.70) * diffuse;
        lin += 0.40 * ambient * vec3(0.40, 0.60, 1.00) * occlusion;
        lin += 0.50 * sky * vec3(0.40, 0.60, 1.00) * occlusion;
        lin += 0.50 * back * vec3(0.25, 0.25, 0.25) * occlusion;
        lin += 0.25 * fresnel * vec3(1.00, 1.00, 1.00) * occlusion;

        color = color * lin;

        color = mix(color, vec3(0.8, 0.9, 1.0), 1.0 - exp(-0.0002 * distance * distance * distance));
    }

    return vec3(clamp(color, 0.0, 1.0));
}

void main() {
    vec2 p = (2.0 * gl_FragCoord.xy - resolution) / resolution.y;

    vec3 origin = camera[3].xyz;
    vec3 direction = normalize(camera * vec4(p, 2.0, 0.0)).xyz;

    vec3 color = render(origin, direction);

    color = pow(color, vec3(0.4545));
    
    fragColor = vec4(color, 1.0);
}
