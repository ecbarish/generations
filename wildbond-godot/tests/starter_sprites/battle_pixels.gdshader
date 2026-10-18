shader_type canvas_item;
// Display the unmodified source at the existing battle sprite's pixel budget.
uniform vec4 source_rect;
uniform vec2 pixel_dims = vec2(64.0);
uniform vec4 palette[16] : source_color;
void fragment() {
	vec2 point = (floor(clamp(UV,vec2(0.0),vec2(0.9999))*pixel_dims)+0.5)/pixel_dims;
	COLOR = texture(TEXTURE,source_rect.xy+point*source_rect.zw);
	float nearest = 100.0;
	vec3 selected = palette[0].rgb;
	for (int i=0;i<16;i++) {
		vec3 delta = COLOR.rgb-palette[i].rgb;
		float difference = dot(delta,delta);
		if (difference<nearest) {nearest=difference;selected=palette[i].rgb;}
	}
	COLOR.rgb = selected;
	COLOR.a = step(0.5,COLOR.a);
}
