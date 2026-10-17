shader_type spatial;
render_mode cull_back;
uniform float wetness = 0.0;
varying vec3 world;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
float noise(vec2 p) {
	vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
	return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
}
void vertex() {
	vec3 p=(MODEL_MATRIX*vec4(VERTEX,1.0)).xyz;
	float outside=smoothstep(11.8,20.0,max(abs(p.x),abs(p.z)));
	VERTEX.y += outside * (1.5+sin(p.x*.18)*sin(p.z*.21)*1.5);
	float pond=length((p.xz-vec2(-6.0,1.0))/vec2(2.8,3.0));
	VERTEX.y -= (1.0-smoothstep(.92,1.13,pond))*.48;
	world=(MODEL_MATRIX*vec4(VERTEX,1.0)).xyz;
}
void fragment() {
	float n=noise(world.xz*.46)*.7+noise(world.xz*3.0)*.3;
	vec3 grass=mix(vec3(.10,.26,.13),vec3(.23,.46,.18),n);
	float main_path=abs(world.x-.22*sin(world.z*.45));
	float branch=max(abs(world.z)-1.12,max(-world.x,world.x-9.0));
	float path=min(main_path-1.35,branch);
	float edge=1.0-smoothstep(-.08,.17,path+(noise(world.xz*4.0)-.5)*.12);
	vec3 dirt=mix(vec3(.40,.29,.17),vec3(.59,.46,.29),noise(world.xz*2.3));
	float pond=length((world.xz-vec2(-6.0,1.0))/vec2(2.8,3.0));
	float bank=1.0-smoothstep(.98,1.19,pond);
	vec3 colour=mix(grass,dirt, max(edge,bank));
	ALBEDO=colour*mix(1.0,.69,wetness);
	ROUGHNESS=mix(.96,.35,wetness);
}
