shader_type spatial;
render_mode cull_disabled;
uniform float storm = 0.0;
varying vec3 world;
void vertex() {
	world=(MODEL_MATRIX*vec4(VERTEX,1.0)).xyz;
	VERTEX.y += sin(world.x*2.7+TIME*1.3)*.012+cos(world.z*3.2+TIME*.8)*.009;
}
void fragment() {
	float r=length(UV*2.0-1.0);
	if(r>1.0) discard;
	float ripples=sin(world.x*4.0+world.z*2.3+TIME*1.4)*cos(world.z*3.1-TIME*.9);
	float foam=smoothstep(.88,.995,r)*(.62+.38*sin(TIME*1.7+world.x*6.0));
	ALBEDO=mix(vec3(.025,.20,.23),vec3(.25,.55,.48), .22+foam*.6+ ripples*.04);
	METALLIC=.35;
	ROUGHNESS=mix(.09,.24,storm);
	NORMAL_MAP=vec3(.5+sin(world.x*3.0+TIME*1.3)*(.06+storm*.04),.5+cos(world.z*3.5-TIME)*.06,1.0);
	NORMAL_MAP_DEPTH=.6;
}
