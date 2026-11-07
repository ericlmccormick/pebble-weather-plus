top = '.'
out = 'build'
def options(ctx):
    ctx.load('pebble_sdk')
def configure(ctx):
    ctx.load('pebble_sdk')
def build(ctx):
    ctx.load('pebble_sdk')
    ctx.pbl_bundle(binaries=[])
