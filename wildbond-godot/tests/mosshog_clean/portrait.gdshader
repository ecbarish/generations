shader_type canvas_item;
uniform vec4 source_rect;
void fragment(){COLOR=texture(TEXTURE,source_rect.xy+UV*source_rect.zw);}
