from pathlib import Path
from fontTools.ttLib import TTFont
import re,json
for name in ['shafter-lawyer','ruesga','foundation']:
 root=Path('D:/Projects')/name
 replacements={}
 for p in (root/'public/assets').iterdir():
  if p.suffix.lower() not in ['.ttf','.woff']:continue
  dest=p.with_suffix('.woff2')
  try:
   font=TTFont(p);font.flavor='woff2';font.save(dest);font.close()
   replacements['/assets/'+p.name]='/assets/'+dest.name
  except Exception:pass
 for p in (root/'public/styles').glob('*.css'):
  css=p.read_text('utf-8')
  for a,b in replacements.items():
   css=css.replace(a,b)
  css=re.sub(r'(url\([^)]*\.woff2\))\s*format\([\'"](?:truetype|woff)[\'"]\)',r'\1 format("woff2")',css)
  p.write_text(css,encoding='utf-8')
 (root/'migration/optimized-fonts.json').write_text(json.dumps(replacements,indent=2),encoding='utf-8')
 print(name,len(replacements),'fonts converted',flush=True)
