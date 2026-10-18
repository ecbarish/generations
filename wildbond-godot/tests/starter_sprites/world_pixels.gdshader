shader_type spatial;
render_mode unshaded, cull_disabled, depth_prepass_alpha;
uniform sampler2D sheet : source_color, filter_nearest, repeat_disable;
uniform vec4 source_rect;
uniform vec2 pixel_dims = vec2(32.0);
uniform vec4 palette[16] : source_color;
void vertex() {
	MODELVIEW_MATRIX = VIEW_MATRIX * mat4(INV_VIEW_MATRIX[0],INV_VIEW_MATRIX[1],INV_VIEW_MATRIX[2],MODEL_MATRIX[3]);
}
void fragment() {
	vec2 local_uv = (UV-source_rect.xy)/source_rect.zw;
	vec2 point = (floor(clamp(local_uv,vec2(0.0),vec2(0.9999))*pixel_dims)+0.5)/pixel_dims;
	vec4 ink = texture(sheet,source_rect.xy+point*source_rect.zw);
	float nearest = 100.0;
	vec3 selected = palette[0].rgb;
	for (int i=0;i<16;i++) {
		vec3 delta = ink.rgb-palette[i].rgb;
		float difference = dot(delta,delta);
		if (difference<nearest) {nearest=difference;selected=palette[i].rgb;}
	}
	ALBEDO = selected * COLOR.rgb;
	ALPHA = ink.a;
	ALPHA_SCISSOR_THRESHOLD = 0.5;
}
