shader_type canvas_item;
uniform vec4 source_rect;
uniform vec2 source_size;
uniform vec2 root_px;
uniform float sample_step = 4.0;
uniform vec4 palette[16] : source_color;
void fragment() {
    vec2 point=(floor((UV*source_size-root_px)/sample_step)+0.5)*sample_step+root_px;
    bool inside=point.x>=0.0 && point.y>=0.0 && point.x<source_size.x && point.y<source_size.y;
    vec4 ink=texture(TEXTURE,source_rect.xy+point/source_size*source_rect.zw);
    float nearest=100.0;vec3 selected=palette[0].rgb;
    for(int i=0;i<16;i++){vec3 delta=ink.rgb-palette[i].rgb;float d=dot(delta,delta);if(d<nearest){nearest=d;selected=palette[i].rgb;}}
    COLOR=vec4(selected,inside?step(0.5,ink.a):0.0);
}
