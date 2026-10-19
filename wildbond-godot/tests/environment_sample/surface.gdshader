shader_type spatial;
render_mode diffuse_burley;
uniform vec4 tint : source_color = vec4(1.0);
uniform bool foliage = false;
uniform bool shingles = false;
varying vec3 world;
float noise(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
void vertex(){
 if(foliage && COLOR.g > COLOR.r*1.1){VERTEX.x += sin(TIME*1.1+MODEL_MATRIX[3].x+VERTEX.y)*0.018*max(0.0,VERTEX.y-1.5);}
 world=(MODEL_MATRIX*vec4(VERTEX,1.0)).xyz;
}
void fragment(){
 vec3 c=pow(COLOR.rgb,vec3(2.2))*tint.rgb;
 float grain=noise(floor(world.xz*18.0+world.y*7.0));
 if(shingles){
  vec2 p=UV*vec2(30.0,18.0);p.x+=mod(floor(p.y),2.0)*0.5;
  vec2 q=fract(p);float edge=step(q.x,0.045)+step(q.y,0.08);
  c*=0.88+noise(floor(p))*0.20;c*=1.0-min(edge,1.0)*0.24;
 }else{c*=0.93+grain*0.12;}
 ALBEDO=c;ROUGHNESS=0.95;
}
