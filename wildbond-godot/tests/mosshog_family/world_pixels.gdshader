shader_type spatial;
render_mode unshaded,cull_disabled,depth_prepass_alpha;
uniform sampler2D sheet : source_color,filter_nearest,repeat_disable;
uniform vec4 source_rect;
uniform vec2 source_size;
uniform vec2 root_px;
uniform float sample_step=4.0;
uniform vec4 palette[16] : source_color;
void vertex(){MODELVIEW_MATRIX=VIEW_MATRIX*mat4(INV_VIEW_MATRIX[0],INV_VIEW_MATRIX[1],INV_VIEW_MATRIX[2],MODEL_MATRIX[3]);}
void fragment(){
    vec2 local_uv=(UV-source_rect.xy)/source_rect.zw;
    vec2 point=(floor((local_uv*source_size-root_px)/sample_step)+0.5)*sample_step+root_px;
    bool inside=point.x>=0.0 && point.y>=0.0 && point.x<source_size.x && point.y<source_size.y;
    vec4 ink=texture(sheet,source_rect.xy+point/source_size*source_rect.zw);
    float nearest=100.0;vec3 selected=palette[0].rgb;
    for(int i=0;i<16;i++){vec3 delta=ink.rgb-palette[i].rgb;float d=dot(delta,delta);if(d<nearest){nearest=d;selected=palette[i].rgb;}}
    ALBEDO=selected*COLOR.rgb;ALPHA=inside?ink.a:0.0;ALPHA_SCISSOR_THRESHOLD=0.5;
}
