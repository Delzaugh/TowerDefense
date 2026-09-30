"""Check local evidence, provenance and Markdown reference integrity."""
from pathlib import Path
import hashlib, json, re

root = Path(__file__).resolve().parent
project = root.parents[2]
sources = json.loads((root / 'sources.json').read_text(encoding='utf-8'))
frames = json.loads((root / 'frame_analysis.json').read_text(encoding='utf-8'))
report = project / 'docs/design/Mona_Octocat_Animation_Research.md'
documents = [report] + [project / f'blender/towers/{asset}/v01/decisions.md'
    for asset in ['copilot_octocat_2_0','copilot_octocat_2_0_lowpoly']]
for doc in documents:
    for link in re.findall(r'\]\(([^)]+)\)', doc.read_text(encoding='utf-8')):
        if '://' not in link and not link.startswith('#'):
            assert (doc.parent / link).exists(), f'Missing link: {doc}: {link}'
digests = []
for media in sources['captured_media']:
    file = root / media['file']
    assert file.exists(), file
    digests.append({'file':file.name, 'sha256':hashlib.sha256(file.read_bytes()).hexdigest()})
    if 'derived_contact_sheet' in media:
        assert (root / media['derived_contact_sheet']).exists()
for entry in frames:
    assert entry['duration_ms'] > 0 and entry['frames'] > 1
    assert len(entry['sample_indices']) == len(entry['sample_times_ms'])
(root / 'reference_digests.json').write_text(json.dumps(digests, indent=2), encoding='utf-8')
print(f'Checked {len(documents)} document link sets, {len(sources["sources"])} sources, '
      f'{len(digests)} captured media and {len(frames)} GIF analyses.')
