shader_type spatial;
render_mode unshaded,cull_disabled,depth_prepass_alpha;
uniform sampler2D sheet : source_color,filter_nearest,repeat_disable;
void vertex(){MODELVIEW_MATRIX=VIEW_MATRIX*mat4(INV_VIEW_MATRIX[0],INV_VIEW_MATRIX[1],INV_VIEW_MATRIX[2],MODEL_MATRIX[3]);}
void fragment(){vec4 ink=texture(sheet,UV);ALBEDO=ink.rgb*COLOR.rgb;ALPHA=ink.a;ALPHA_SCISSOR_THRESHOLD=0.5;}
