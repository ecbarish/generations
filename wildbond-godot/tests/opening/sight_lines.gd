extends RefCounted
## Check actual building extents against camera-to-person rays, not footprint centers.
static func covers(bounds: AABB, eye: Vector3, feet: Vector3) -> bool:
	for height in [.45,1.15]:
		var target := feet+Vector3(0,height,0)
		if bounds.intersects_segment(eye,target)!=null:return true
	return false

static func world_bounds(meshes: Array) -> AABB:
	var bounds := AABB()
	var first := true
	for mesh in meshes:
		var box: AABB=mesh.global_transform*mesh.get_aabb()
		bounds=box if first else bounds.merge(box)
		first=false
	return bounds
