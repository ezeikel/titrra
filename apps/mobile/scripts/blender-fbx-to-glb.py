import bpy
import sys

argv = sys.argv[sys.argv.index("--") + 1:]
SRC, OUT = argv[0], argv[1]

bpy.ops.wm.read_factory_settings(use_empty=True)

# Import the FBX (Blender handles the rig + axis conversion).
bpy.ops.import_scene.fbx(filepath=SRC)

# Apply armature modifiers (bake rest pose into mesh) + drop the skeleton, so we
# export a clean STATIC mesh — same approach as the GLB bake.
meshes = [o for o in bpy.data.objects if o.type == 'MESH']
for o in bpy.data.objects:
    o.select_set(False)
for m in meshes:
    bpy.context.view_layer.objects.active = m
    m.select_set(True)
    for mod in list(m.modifiers):
        try:
            bpy.ops.object.modifier_apply(modifier=mod.name)
        except Exception:
            m.modifiers.remove(mod)
    bpy.ops.object.parent_clear(type='CLEAR_KEEP_TRANSFORM')
    m.select_set(False)

# Delete non-mesh objects (armatures, empties).
for o in list(bpy.data.objects):
    if o.type != 'MESH':
        bpy.data.objects.remove(o, do_unlink=True)

# Apply transforms so geometry is baked into world space, Y-up.
for o in bpy.data.objects:
    o.select_set(o.type == 'MESH')
bpy.context.view_layer.objects.active = meshes[0] if meshes else None
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

bpy.ops.export_scene.gltf(
    filepath=OUT,
    export_format='GLB',
    export_skins=False,
    export_animations=False,
    export_morph=False,
    export_yup=True,
    use_selection=False,
)
print("FBX_BAKE_DONE", OUT)
