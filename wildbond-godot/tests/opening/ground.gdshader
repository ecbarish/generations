shader_type spatial;
render_mode diffuse_burley;
varying vec3 world;
void vertex(){ world=(MODEL_MATRIX*vec4(VERTEX,1.0)).xyz; }
float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
void fragment(){
 vec2 p=floor(world.xz*8.0);
 float grain=hash(p);
 float broad=hash(floor(world.xz*1.4));
 ALBEDO=COLOR.rgb*(0.90+grain*0.13+broad*0.08);
 ROUGHNESS=0.95;
}
