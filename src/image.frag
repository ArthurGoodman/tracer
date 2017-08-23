#version 120

varying out vec4 fragColor;

uniform vec2 resolution;

uniform mat4 cam_t;
uniform mat4 cam_r;

//------------------------------------------------------------------

float sdPlane( vec3 p )
{
    return p.y;
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

// vec2 map(vec3 pos) {
//     vec2 res = opU( vec2( sdPlane(     pos), 0.5 ),
//                     vec2( sdSphere(    pos-vec3( 0.0,0.25, 0.0), 0.25 ), 46.9 ) );
//     res = opU( res, vec2( sdBox(       pos-vec3( 1.0,0.25, 0.0), vec3(0.25) ), 3.0 ) );
//     res = opU( res, vec2( udRoundBox(  pos-vec3( 1.0,0.25, 1.0), vec3(0.15), 0.1 ), 41.0 ) );
//     res = opU( res, vec2( sdTorus(     pos-vec3( 0.0,0.25, 1.0), vec2(0.20,0.05) ), 25.0 ) );
//     res = opU( res, vec2( sdCapsule(   pos,vec3(-1.3,0.10,-0.1), vec3(-0.8,0.50,0.2), 0.1  ), 31.9 ) );
//     res = opU( res, vec2( sdTriPrism(  pos-vec3(-1.0,0.25,-1.0), vec2(0.25,0.05) ),43.5 ) );
//     res = opU( res, vec2( sdCylinder(  pos-vec3( 1.0,0.30,-1.0), vec2(0.1,0.2) ), 8.0 ) );
//     res = opU( res, vec2( sdCone(      pos-vec3( 0.0,0.50,-1.0), vec3(0.8,0.6,0.3) ), 55.0 ) );
//     res = opU( res, vec2( sdTorus82(   pos-vec3( 0.0,0.25, 2.0), vec2(0.20,0.05) ),50.0 ) );
//     res = opU( res, vec2( sdTorus88(   pos-vec3(-1.0,0.25, 2.0), vec2(0.20,0.05) ),43.0 ) );
//     res = opU( res, vec2( sdCylinder6( pos-vec3( 1.0,0.30, 2.0), vec2(0.1,0.2) ), 12.0 ) );
//     res = opU( res, vec2( sdHexPrism(  pos-vec3(-1.0,0.20, 1.0), vec2(0.25,0.05) ),17.0 ) );
//     res = opU( res, vec2( sdPryamid4(  pos-vec3(-1.0,0.15,-2.0), vec3(0.8,0.6,0.25) ),37.0 ) );
//     res = opU( res, vec2( opS( udRoundBox(  pos-vec3(-2.0,0.2, 1.0), vec3(0.15),0.05),
//                                sdSphere(    pos-vec3(-2.0,0.2, 1.0), 0.25)), 13.0 ) );
//     res = opU( res, vec2( opS( sdTorus82(  pos-vec3(-2.0,0.2, 0.0), vec2(0.20,0.1)),
//                                sdCylinder(  opRep( vec3(atan(pos.x+2.0,pos.z)/6.2831, pos.y, 0.02+0.5*length(pos-vec3(-2.0,0.2, 0.0))), vec3(0.05,1.0,0.05)), vec2(0.02,0.6))), 51.0 ) );
//     res = opU( res, vec2( 0.5*sdSphere(    pos-vec3(-2.0,0.25,-1.0), 0.2 ) + 0.03*sin(50.0*pos.x)*sin(50.0*pos.y)*sin(50.0*pos.z), 65.0 ) );
//     res = opU( res, vec2( 0.5*sdTorus( opTwist(pos-vec3(-2.0,0.25, 2.0)),vec2(0.20,0.05)), 46.7 ) );
//     res = opU( res, vec2( sdConeSection( pos-vec3( 0.0,0.35,-2.0), 0.15, 0.2, 0.1 ), 13.67 ) );
//     res = opU( res, vec2( sdEllipsoid( pos-vec3( 1.0,0.35,-2.0), vec3(0.15, 0.2, 0.05) ), 43.17 ) );
        
//     return res;
// }

vec2 map(vec3 p) {
    float d = sdBox(p, vec3(1.0));

    float s = 1.0;
    for (int m = 0; m < 3; m++) {
        vec3 a = mod(p * s, 2.0) - 1.0;

        s *= 3.0;

        vec3 r = abs(1.0 - 3.0 * abs(a));

        float da = max(r.x, r.y);
        float db = max(r.y, r.z);
        float dc = max(r.z, r.x);
        float c = (min(da, min(db, dc)) - 1.0) / s;

        d = max(d, c);
    }

    return opU(vec2(sdPlane(p + vec3(0, 1, 0)), 0.5), vec2(d, 55));
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

// float shadow(vec3 origin, vec3 direction, float minDist, float maxDist, float k) {
//     const int maxIt = 64;

//     float result = 1.0;
//     float distance = minDist;

//     for (int i = 0; i < maxIt; i++) {
//         float h = map(origin + direction * distance).x;

//         result = min(result, k * h / distance);
//         distance += clamp(h, minDist, 0.1);

//         if (h < 0.0001 || distance > maxDist)
//             break;
//     }

//     return clamp(result, 0.0, 1.0);
// }

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

// vec3 render(vec3 origin, vec3 direction) {
//     vec3 color = vec3(0.7, 0.9, 1.0) + direction.y * 0.8;

//     vec2 result = castRay(origin, direction);
//     float distance = result.x;
//     float material = result.y;

//     if (material > -0.5) {
//         vec3 pos = origin + distance * direction;
//         vec3 normal = calcNormal(pos);
//         vec3 reflection = reflect(direction, normal);
        
//         color = 0.45 + 0.35 * sin(vec3(0.05, 0.08, 0.10) * (material - 1.0));
//         if (material < 1.5) {
//             float f = mod(floor(5.0 * pos.z) + floor(5.0 * pos.x), 2.0);
//             color = 0.3 + 0.1 * f * vec3(1.0);
//         }

//         vec3 light = normalize(vec3(-0.4, 0.7, -0.6));

//         float occlusion = calcAmbientOcclusion(pos, normal);
//         float ambient = clamp(0.5 + 0.5 * normal.y, 0.0, 1.0);
//         float diffuse = clamp(dot(normal, light), 0.0, 1.0);
//         float back = clamp(dot(normal, normalize(vec3(-light.x, 0.0, -light.z))), 0.0, 1.0) * clamp(1.0 - pos.y, 0.0, 1.0);
//         float sky = smoothstep(-0.1, 0.1, reflection.y);
//         float fresnel = pow(clamp(1.0 + dot(normal, direction), 0.0, 1.0), 2.0);
//         float specular = pow(clamp(dot(reflection, light), 0.0, 1.0), 16.0);
        
//         diffuse *= shadow( pos, light, 0.02, 2.5, 8);
//         sky *= shadow( pos, reflection, 0.02, 2.5, 8);

//         vec3 lin = vec3(0.0);
//         lin += 1.30 * diffuse * vec3(1.00, 0.80, 0.55);
//         lin += 2.00 * specular * vec3(1.00, 0.90, 0.70) * diffuse;
//         lin += 0.40 * ambient * vec3(0.40, 0.60, 1.00) * occlusion;
//         lin += 0.50 * sky * vec3(0.40, 0.60, 1.00) * occlusion;
//         lin += 0.50 * back * vec3(0.25, 0.25, 0.25) * occlusion;
//         lin += 0.25 * fresnel * vec3(1.00, 1.00, 1.00) * occlusion;

//         color = color * lin;

//         color = mix(color, vec3(0.8, 0.9, 1.0), 1.0 - exp(-0.0002 * distance * distance * distance));
//     }

//     return vec3(clamp(color, 0.0, 1.0));
// }

//------------------------------------------------------------------------------
// BRDF
//------------------------------------------------------------------------------

#define saturate(x) clamp(x, 0.0, 1.0)
#define PI 3.14159265359

float pow5(float x) {
    float x2 = x * x;
    return x2 * x2 * x;
}

float D_GGX(float linearRoughness, float NoH, const vec3 h) {
    // Walter et al. 2007, "Microfacet Models for Refraction through Rough Surfaces"
    float oneMinusNoHSquared = 1.0 - NoH * NoH;
    float a = NoH * linearRoughness;
    float k = linearRoughness / (oneMinusNoHSquared + a * a);
    float d = k * k * (1.0 / PI);
    return d;
}

float V_SmithGGXCorrelated(float linearRoughness, float NoV, float NoL) {
    // Heitz 2014, "Understanding the Masking-Shadowing Function in Microfacet-Based BRDFs"
    float a2 = linearRoughness * linearRoughness;
    float GGXV = NoL * sqrt((NoV - a2 * NoV) * NoV + a2);
    float GGXL = NoV * sqrt((NoL - a2 * NoL) * NoL + a2);
    return 0.5 / (GGXV + GGXL);
}

vec3 F_Schlick(const vec3 f0, float VoH) {
    // Schlick 1994, "An Inexpensive BRDF Model for Physically-Based Rendering"
    return f0 + (vec3(1.0) - f0) * pow5(1.0 - VoH);
}

float F_Schlick(float f0, float f90, float VoH) {
    return f0 + (f90 - f0) * pow5(1.0 - VoH);
}

float Fd_Burley(float linearRoughness, float NoV, float NoL, float LoH) {
    // Burley 2012, "Physically-Based Shading at Disney"
    float f90 = 0.5 + 2.0 * linearRoughness * LoH * LoH;
    float lightScatter = F_Schlick(1.0, f90, NoL);
    float viewScatter  = F_Schlick(1.0, f90, NoV);
    return lightScatter * viewScatter * (1.0 / PI);
}

float Fd_Lambert() {
    return 1.0 / PI;
}

//------------------------------------------------------------------------------
// Indirect lighting
//------------------------------------------------------------------------------

vec3 Irradiance_SphericalHarmonics(const vec3 n) {
    // Irradiance from "Ditch River" IBL (http://www.hdrlabs.com/sibl/archive.html)
    return max(
          vec3( 0.754554516862612,  0.748542953903366,  0.790921515418539)
        + vec3(-0.083856548007422,  0.092533500963210,  0.322764661032516) * (n.y)
        + vec3( 0.308152705331738,  0.366796330467391,  0.466698181299906) * (n.z)
        + vec3(-0.188884931542396, -0.277402551592231, -0.377844212327557) * (n.x)
        , 0.0);
}

vec2 PrefilteredDFG_Karis(float roughness, float NoV) {
    // Karis 2014, "Physically Based Material on Mobile"
    const vec4 c0 = vec4(-1.0, -0.0275, -0.572,  0.022);
    const vec4 c1 = vec4( 1.0,  0.0425,  1.040, -0.040);

    vec4 r = roughness * c0 + c1;
    float a004 = min(r.x * r.x, exp2(-9.28 * NoV)) * r.x + r.y;

    return vec2(-1.04, 1.04) * a004 + r.zw;
}

//------------------------------------------------------------------------------
// Tone mapping and transfer functions
//------------------------------------------------------------------------------

vec3 Tonemap_ACES(const vec3 x) {
    // Narkowicz 2015, "ACES Filmic Tone Mapping Curve"
    const float a = 2.51;
    const float b = 0.03;
    const float c = 2.43;
    const float d = 0.59;
    const float e = 0.14;
    return (x * (a * x + b)) / (x * (c * x + d) + e);
}

vec3 OECF_sRGBFast(const vec3 linear) {
    return pow(linear, vec3(1.0 / 2.2));
}

//------------------------------------------------------------------------------
// Rendering
//------------------------------------------------------------------------------

float shadow(vec3 origin, vec3 direction, float minDist, float maxDist, float k) {
    float hit = 1.0;
    float t = minDist;
    
    for (int i = 0; i < 1000; i++) {
        float h = map(origin + direction * t).x;
        if (h < 0.0001) return 0.0;
        t += h;
        hit = min(hit, k * h / t);
        if (t >= maxDist) break;
    }

    return clamp(hit, 0.0, 1.0);
}

vec3 render(vec3 origin, vec3 direction) {
    // Sky gradient
    vec3 color = vec3(0.65, 0.85, 1.0) + direction.y * 0.72;

    // (distance, material)
    vec2 hit = castRay(origin, direction);
    float distance = hit.x;
    float material = hit.y;

    // We've hit something in the scene
    if (material > 0.0) {
        vec3 position = origin + distance * direction;

        vec3 v = normalize(-direction);
        vec3 n = calcNormal(position);
        vec3 l = normalize(vec3(0.6, 0.7, -0.7));
        vec3 h = normalize(v + l);
        vec3 r = normalize(reflect(direction, n));

        float NoV = abs(dot(n, v)) + 1e-5;
        float NoL = saturate(dot(n, l));
        float NoH = saturate(dot(n, h));
        float LoH = saturate(dot(l, h));

        vec3 baseColor = vec3(0.0);
        float roughness = 0.0;
        float metallic = 0.0;

        float intensity = 2.0;
        float indirectIntensity = 0.64;

        if (material < 1.0)  {
            // Checkerboard floor
            float f = mod(floor(6.0 * position.z) + floor(6.0 * position.x), 2.0);
            baseColor = 0.4 + f * vec3(0.6);
            roughness = 0.1;
        } else {
            // Metallic objects
            // baseColor = vec3(0.3, 0.0, 0.0);
            baseColor = 0.45 + 0.35 * sin(vec3(0.05, 0.08, 0.10) * (material - 1.0));
            roughness = 0.2;
        }

        float occlusion = calcAmbientOcclusion(position, n);

        float linearRoughness = roughness * roughness;
        vec3 diffuseColor = (1.0 - metallic) * baseColor.rgb * occlusion;
        vec3 f0 = 0.04 * (1.0 - metallic) + baseColor.rgb * metallic;

        float attenuation = shadow(position, l, 0.001, 2.5, 8);

        // specular BRDF
        float D = D_GGX(linearRoughness, NoH, h);
        float V = V_SmithGGXCorrelated(linearRoughness, NoV, NoL);
        vec3  F = F_Schlick(f0, LoH);
        vec3 Fr = (D * V) * F;

        // diffuse BRDF
        vec3 Fd = diffuseColor * Fd_Burley(linearRoughness, NoV, NoL, LoH);

        color = Fd + Fr;
        color *= (intensity * attenuation * NoL) * vec3(0.98, 0.92, 0.89);

        // diffuse indirect
        vec3 indirectDiffuse = Irradiance_SphericalHarmonics(n) * Fd_Lambert();

        vec2 indirectHit = castRay(position, r);
        vec3 indirectSpecular = vec3(0.65, 0.85, 1.0) + r.y * 0.72;
        if (indirectHit.y > 0.0) {
            if (indirectHit.y < 1.0)  {
                vec3 indirectPosition = position + indirectHit.x * r;
                // Checkerboard floor
                float f = mod(floor(6.0 * indirectPosition.z) + floor(6.0 * indirectPosition.x), 2.0);
                indirectSpecular = 0.4 + f * vec3(0.6);
            } else {
                // Metallic objects
                // indirectSpecular = vec3(0.3, 0.0, 0.0);
                indirectSpecular = 0.45 + 0.35 * sin(vec3(0.05, 0.08, 0.10) * (indirectHit.y - 1.0));
            }
        }

        // indirect contribution
        vec2 dfg = PrefilteredDFG_Karis(roughness, NoV);
        vec3 specularColor = f0 * dfg.x + dfg.y;
        vec3 ibl = diffuseColor * indirectDiffuse + indirectSpecular * specularColor;

        color += ibl * indirectIntensity;
    }

    // // Exponential distance fog
    // color = mix(color, 0.8 * vec3(0.7, 0.8, 1.0), 1.0 - exp2(-0.011 * distance * distance));

    color = mix(color, vec3(0.8, 0.9, 1.0), 1.0 - exp(-0.0002 * distance * distance * distance));

    return color;
}

#define AA 1

void main() {
    vec3 total = vec3(0.0);
#if AA > 1
    for (int m = 0; m < AA; m++)
    for (int n = 0; n < AA; n++)
    {
        // pixel coordinates
        vec2 o = vec2(float(m),float(n)) / float(AA) - 0.5;
        vec2 p = (-resolution.xy + 2.0*(gl_FragCoord.xy+o))/resolution.y;
#else    
        vec2 p = (-resolution.xy + 2.0*gl_FragCoord.xy)/resolution.y;
#endif

    // vec2 p = (2.0 * gl_FragCoord.xy - resolution) / resolution.y;

    vec3 origin = cam_t[3].xyz;
    vec3 direction = (cam_t * cam_r * normalize(vec4(p.xy, 2.0, 0.0))).xyz;

    vec3 color = render(origin, direction);

    // // Gamma correction
    // color = pow(color, vec3(0.4545));

    // Tone mapping
    color = Tonemap_ACES(color);

    // Gamma compression
    color = OECF_sRGBFast(color);

    total += color;
#if AA > 1
    }

    total /= float(AA*AA);
#endif 
    
    fragColor = vec4(total, 1.0);
}
