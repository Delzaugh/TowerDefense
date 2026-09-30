from pathlib import Path
exec(compile(Path(__file__).with_name('boundary_bridge_build.py').read_text(), str(Path(__file__).with_name('boundary_bridge_build.py')), 'exec'))
