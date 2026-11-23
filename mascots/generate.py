# Round, confident mascots sharing one style: ball body, face window, half-lidded eyes, crossed arms, memory orb.
def defs(light, base, dark, face_l, face_d):
    return f'''  <defs>
    <filter id="fuzz" filterUnits="userSpaceOnUse" x="0" y="0" width="400" height="400">
      <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="2" seed="3"/>
      <feDisplacementMap in="SourceGraphic" scale="3.5"/>
    </filter>
    <filter id="glow" filterUnits="userSpaceOnUse" x="0" y="0" width="400" height="400"><feGaussianBlur stdDeviation="9"/></filter>
    <radialGradient id="shade" cx="38%" cy="26%" r="80%">
      <stop offset="0" stop-color="{light}"/><stop offset=".65" stop-color="{base}"/><stop offset="1" stop-color="{dark}"/>
    </radialGradient>
    <radialGradient id="face" cx="45%" cy="35%" r="75%">
      <stop offset="0" stop-color="{face_l}"/><stop offset="1" stop-color="{face_d}"/>
    </radialGradient>
    <radialGradient id="orb" cx="38%" cy="32%" r="70%">
      <stop offset="0" stop-color="#FFFFFF"/><stop offset=".35" stop-color="#CFE3FF"/>
      <stop offset=".7" stop-color="#8DB3F7"/><stop offset="1" stop-color="#B9A6F0"/>
    </radialGradient>
  </defs>
'''
EYES = '''  <path d="M166 196h18a9 9 0 0 1-18 0z" fill="#16151A"/>
  <path d="M216 196h18a9 9 0 0 1-18 0z" fill="#16151A"/>
  <path d="M163 195h24M213 195h24" stroke="#16151A" stroke-width="3" stroke-linecap="round"/>
  <circle cx="179" cy="200" r="1.8" fill="#fff"/><circle cx="229" cy="200" r="1.8" fill="#fff"/>
'''
NOSE_SMIRK = '''  <ellipse cx="200" cy="226" rx="6" ry="4" fill="#16151A"/>
  <path d="M189 238q11 6 23-4" stroke="#16151A" stroke-width="3" fill="none" stroke-linecap="round"/>
'''
BLUSH = '''  <ellipse cx="154" cy="226" rx="10" ry="5" fill="#F2B8C2" opacity=".5"/>
  <ellipse cx="246" cy="226" rx="10" ry="5" fill="#F2B8C2" opacity=".5"/>
'''
def arms(edge, a, b):
    return f'''  <g filter="url(#fuzz)">
    <path d="M116 284Q170 310 236 300" stroke="{edge}" stroke-width="34" fill="none" stroke-linecap="round"/>
    <path d="M116 284Q170 310 236 300" stroke="{a}" stroke-width="28" fill="none" stroke-linecap="round"/>
    <path d="M284 284Q230 312 164 304" stroke="{edge}" stroke-width="34" fill="none" stroke-linecap="round"/>
    <path d="M284 284Q230 312 164 304" stroke="{b}" stroke-width="28" fill="none" stroke-linecap="round"/>
  </g>
'''
ORB = '''  <circle cx="64" cy="128" r="30" fill="#9CC1FF" opacity=".55" filter="url(#glow)"/>
  <circle cx="64" cy="128" r="22" fill="url(#orb)"/>
  <ellipse cx="64" cy="131" rx="14" ry="4" fill="none" stroke="#fff" stroke-width="2" opacity=".75" transform="rotate(-18 64 131)"/>
  <ellipse cx="57" cy="119" rx="6" ry="4" fill="#fff" opacity=".8"/>
'''
def svg(c, behind, face, features, arms_svg, feet):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
{defs(c['light'],c['base'],c['dark'],c['face_l'],c['face_d'])}  <ellipse cx="200" cy="368" rx="120" ry="11" fill="#000" opacity=".07"/>
  <g filter="url(#fuzz)">
{behind}    <circle cx="200" cy="232" r="124" fill="url(#shade)"/>
    <ellipse cx="156" cy="354" rx="30" ry="13" fill="{feet}"/>
    <ellipse cx="244" cy="354" rx="30" ry="13" fill="{feet}"/>
  </g>
{face}{features}{arms_svg}{ORB}</svg>
'''
FACE = '  <ellipse cx="200" cy="204" rx="74" ry="56" fill="url(#face)" filter="url(#fuzz)"/>\n'

# Raccoon
c=dict(light='#CBC6BE',base='#A8A39B',dark='#857F77',face_l='#F8F4ED',face_d='#E6DED2')
behind='''    <path d="M290 318C350 312 372 252 350 196" stroke="#A8A39B" stroke-width="50" fill="none" stroke-linecap="round"/>
    <path d="M290 318C350 312 372 252 350 196" stroke="#55514C" stroke-width="50" fill="none" stroke-dasharray="20 24" stroke-dashoffset="-14"/>
    <path d="M110 160L112 82Q116 70 128 76L184 122Z" fill="#A8A39B" stroke="#A8A39B" stroke-width="16" stroke-linejoin="round"/>
    <path d="M290 160L288 82Q284 70 272 76L216 122Z" fill="#A8A39B" stroke="#A8A39B" stroke-width="16" stroke-linejoin="round"/>
    <path d="M122 106L124 90L150 112Z" fill="#E9C7C9" opacity=".7"/>
    <path d="M278 106L276 90L250 112Z" fill="#E9C7C9" opacity=".7"/>
'''
mask='  <path d="M136 196C142 176 172 174 186 188Q200 198 214 188C228 174 258 176 264 196C268 212 248 218 230 214Q200 206 170 214C152 218 132 212 136 196Z" fill="#5E5A55"/>\n'
open('scout-raccoon.svg','w').write(svg(c,behind,FACE,mask+EYES+NOSE_SMIRK+BLUSH,arms('#8C867E','#A39E96','#ADA8A0'),'#958F87'))

# Fox
c=dict(light='#EBA673',base='#D47F45',dark='#AE5F2D',face_l='#FFF8EF',face_d='#F1E2CF')
behind='''    <path d="M296 320C362 320 384 250 356 190" stroke="#D47F45" stroke-width="58" fill="none" stroke-linecap="round"/>
    <path d="M362 222C364 210 362 200 356 190" stroke="#FBF2E6" stroke-width="58" fill="none" stroke-linecap="round"/>
    <path d="M104 170L100 60Q104 46 118 54L190 118Z" fill="#D47F45" stroke="#D47F45" stroke-width="14" stroke-linejoin="round"/>
    <path d="M296 170L300 60Q296 46 282 54L210 118Z" fill="#D47F45" stroke="#D47F45" stroke-width="14" stroke-linejoin="round"/>
    <path d="M96 62Q100 46 116 54L126 62L100 90Z" fill="#3B2A24" stroke="#3B2A24" stroke-width="10" stroke-linejoin="round"/>
    <path d="M304 62Q300 46 284 54L274 62L300 90Z" fill="#3B2A24" stroke="#3B2A24" stroke-width="10" stroke-linejoin="round"/>
'''
face='  <path d="M126 196C126 160 160 148 200 170C240 148 274 160 274 196C274 238 240 262 200 262C160 262 126 238 126 196Z" fill="url(#face)" filter="url(#fuzz)"/>\n'
open('fox.svg','w').write(svg(c,behind,face,EYES+NOSE_SMIRK+BLUSH,arms('#A75B2B','#C9773F','#D58548'),'#3B2A24'))

# Owl
c=dict(light='#B5A493',base='#8F7B68',dark='#6E5B4A',face_l='#F7F0E4',face_d='#E3D6C2')
behind='''    <path d="M136 126L128 86Q128 78 136 82L178 112Z" fill="#8F7B68" stroke="#8F7B68" stroke-width="12" stroke-linejoin="round"/>
    <path d="M264 126L272 86Q272 78 264 82L222 112Z" fill="#8F7B68" stroke="#8F7B68" stroke-width="12" stroke-linejoin="round"/>
'''
face='''  <circle cx="168" cy="200" r="46" fill="url(#face)" filter="url(#fuzz)"/>
  <circle cx="232" cy="200" r="46" fill="url(#face)" filter="url(#fuzz)"/>
'''
owl_eyes=EYES.replace('h18a9','h18a9').replace('M166 196','M166 196').replace('fill="#16151A"/>','fill="#16151A"/>',)
owl_feat=EYES+'''  <path d="M190 220h20l-10 16z" fill="#E9A23B" stroke="#E9A23B" stroke-width="5" stroke-linejoin="round"/>
  <g fill="none" stroke="#7B6856" stroke-width="3" stroke-linecap="round" opacity=".7">
    <path d="M176 268q8 6 16 0M208 268q8 6 16 0M192 282q8 6 16 0"/>
  </g>
'''
# folded wings crossed in front
wings='''  <g filter="url(#fuzz)">
    <path d="M100 250C110 300 160 320 226 306C190 300 150 280 132 240Z" fill="#7A6755"/>
    <path d="M300 250C290 300 240 320 174 306C210 300 250 280 268 240Z" fill="#846F5C"/>
  </g>
'''
open('owl.svg','w').write(svg(c,behind,face,owl_feat,wings,'#E9A23B'))

# Penguin
c=dict(light='#56627A',base='#323C52',dark='#1F2738',face_l='#FFFFFF',face_d='#ECEFF3')
face='  <path d="M118 210C118 170 150 150 200 178C250 150 282 170 282 210C282 300 250 340 200 340C150 340 118 300 118 210Z" fill="url(#face)" filter="url(#fuzz)"/>\n'
peng_feat=EYES+'''  <path d="M188 220h24l-12 13z" fill="#F0A23A" stroke="#F0A23A" stroke-width="6" stroke-linejoin="round"/>
'''+BLUSH
flips='''  <g filter="url(#fuzz)">
    <ellipse cx="88" cy="262" rx="20" ry="50" fill="#26304A" transform="rotate(28 88 262)"/>
    <ellipse cx="312" cy="262" rx="20" ry="50" fill="#26304A" transform="rotate(-28 312 262)"/>
  </g>
'''
open('penguin.svg','w').write(svg(c,'',face,peng_feat,flips,'#F0A23A'))
