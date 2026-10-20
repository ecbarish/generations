shader_type spatial;
render_mode diffuse_burley;
uniform sampler2D path_mask : filter_linear, repeat_disable;
uniform vec2 cell_min;
uniform vec2 mask_size;
uniform vec4 grass_tint : source_color = vec4(0.40,0.51,0.30,1.0);
uniform vec4 dirt_tint : source_color = vec4(0.70,0.59,0.43,1.0);
varying vec3 world;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 a=floor(p);vec2 f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(a),hash(a+vec2(1,0)),f.x),mix(hash(a+vec2(0,1)),hash(a+vec2(1,1)),f.x),f.y);}
void vertex(){world=(MODEL_MATRIX*vec4(VERTEX,1.0)).xyz;}
void fragment(){
 vec2 cell=world.xz/1.25+vec2(11.0,0.0);
 float organic=noise(world.xz*2.3)*0.65+noise(world.xz*5.5)*0.35;
 vec2 drift=vec2(noise(world.xz*1.9),noise(world.zx*2.1))-0.5;
 float weight=texture(path_mask,(cell-cell_min+0.5+drift*0.22)/mask_size).r;
 float dirt=smoothstep(0.20,0.80,weight+(organic-0.5)*0.16);
 float broad=noise(world.xz*0.65);
 float grain=hash(floor(world.xz*25.0));
 vec3 grass=grass_tint.rgb*(0.90+broad*0.16+grain*0.06);
 vec3 soil=dirt_tint.rgb*(0.93+broad*0.11+grain*0.05);
 ALBEDO=mix(grass,soil,dirt);ROUGHNESS=1.0;
}
