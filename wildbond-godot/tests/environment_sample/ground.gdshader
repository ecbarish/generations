shader_type spatial;
render_mode diffuse_burley;
varying vec3 world;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float smoothnoise(vec2 p){vec2 a=floor(p);vec2 f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(a),hash(a+vec2(1,0)),f.x),mix(hash(a+vec2(0,1)),hash(a+vec2(1,1)),f.x),f.y);}
void vertex(){world=(MODEL_MATRIX*vec4(VERTEX,1.0)).xyz;}
void fragment(){
 vec3 base=pow(COLOR.rgb,vec3(2.2));
 float grain=hash(floor(world.xz*25.0));
 float broad=smoothnoise(world.xz*1.8);
 ALBEDO=base*(0.90+grain*0.12+broad*0.15);
 ROUGHNESS=1.0;
}
