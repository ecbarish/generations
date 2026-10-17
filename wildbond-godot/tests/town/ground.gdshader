shader_type spatial;
uniform float wetness=0.0;
varying vec3 world;
void vertex(){world=(MODEL_MATRIX*vec4(VERTEX,1.0)).xyz;}
void fragment(){
	float grain=fract(sin(dot(floor(world.xz*9.0),vec2(12.98,78.23)))*43758.5);
	vec3 grass=mix(vec3(.24,.40,.17),vec3(.31,.48,.21),grain);
	float street=1.0-smoothstep(1.65,1.83,abs(world.x));
	float crossroad=(1.0-smoothstep(1.25,1.45,abs(world.z)))*(1.0-smoothstep(10.0,11.0,abs(world.x)));
	float plaza=1.0-smoothstep(4.6,4.8,length(world.xz-vec2(0.0,-2.0)));
	float doors=0.0;
	for(int i=-1;i<=1;i+=2){
		doors=max(doors,(1.0-smoothstep(.8,1.0,abs(world.x-float(i)*7.0)))*(1.0-smoothstep(2.6,2.8,abs(world.z+1.5))));
	}
	float paving=max(max(street,crossroad),max(plaza,doors));
	vec2 tile=fract(vec2(world.x*1.1+mod(floor(world.z*1.7),2.0)*.5,world.z*1.7));
	float grout=step(.04,tile.x)*step(.05,tile.y);
	vec3 stone=mix(vec3(.50,.49,.40),vec3(.70,.66,.52),grout);
	ALBEDO=mix(grass,stone,paving)*mix(1.0,.70,wetness);
	ROUGHNESS=mix(.95,.38,wetness);
}
