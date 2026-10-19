import type { RiskView } from '@/lib/data'

/* Weather scene in the home header; layer opacities come from the risk state. */
export function SkyScene({ view }: { view: RiskView }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 170 130" className="absolute top-[70px] right-1.5 h-[130px] w-[170px]">
      <circle cx="112" cy="44" r="26" fill="#E8B931" opacity={view.sunOp} className="transition-opacity duration-500" />
      <g opacity={view.cloudOp} className="transition-opacity duration-500">
        <path d="M38 86h86a20 20 0 0 0 2-40 30 30 0 0 0-56-4 22 22 0 0 0-32 44z" fill="#F3EFE6" />
        <path d="M70 92h70a15 15 0 0 0 0-30 22 22 0 0 0-40-2 16 16 0 0 0-30 32z" fill="#E4E2DA" />
      </g>
      <g opacity={view.rainOp} stroke="#A9CDD3" strokeWidth="3" strokeLinecap="round" className="transition-opacity duration-500">
        <path d="M60 100l-6 14" /><path d="M80 100l-6 14" /><path d="M100 100l-6 14" /><path d="M120 100l-6 14" />
        <path d="M70 116l-4 9" /><path d="M110 116l-4 9" />
      </g>
      <g opacity={view.fogOp} fill="#FFFFFF" className="transition-opacity duration-500">
        <rect x="10" y="96" width="120" height="7" rx="3.5" opacity="0.7" />
        <rect x="40" y="108" width="128" height="7" rx="3.5" opacity="0.55" />
        <rect x="0" y="120" width="96" height="7" rx="3.5" opacity="0.45" />
      </g>
    </svg>
  )
}

// [cx, cy, r] for the leafy potato plants on the ridge
const CROP_PLANTS: [number, number, number][] = [
  [14, 22, 7], [22, 18, 6], [64, 20, 7], [72, 17, 5], [114, 21, 7], [122, 17, 6], [164, 20, 7], [172, 16, 5],
  [214, 21, 7], [222, 18, 6], [264, 20, 7], [272, 16, 5], [314, 21, 7], [322, 17, 6], [364, 20, 7], [372, 16, 5],
]

/* Soil ridges with potato plants along the bottom of the home header. */
export function FieldStrip() {
  return (
    <svg aria-hidden="true" viewBox="0 0 390 44" preserveAspectRatio="none" className="absolute bottom-0 left-0 h-11 w-full">
      <path d="M0 26 Q 30 18 60 26 T 120 26 T 180 26 T 240 26 T 300 26 T 360 26 T 420 26 V44 H0z" fill="#7A5434" />
      <path d="M0 34 Q 30 27 60 34 T 120 34 T 180 34 T 240 34 T 300 34 T 360 34 T 420 34 V44 H0z" fill="#5E3F27" />
      <g fill="#2F6B3A">
        {CROP_PLANTS.map(([cx, cy, r]) => (
          <circle key={cx} cx={cx} cy={cy} r={r} />
        ))}
      </g>
    </svg>
  )
}

export function LogoMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 32 32" className="size-[34px]">
      <path d="M16 3l11 4v8c0 7-5 12-11 14C10 27 5 22 5 15V7z" fill="#2B1E16" />
      <path d="M11 20c0-5 3-9 10-9 0 6-4 9-9 9" fill="#E8B931" />
      <path d="M11 21c2-3 4-5 7-6.5" stroke="#2B1E16" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </svg>
  )
}

/* 5-day strip glyphs */
export function DayGlyph({ risk }: { risk: 'safe' | 'watch' | 'danger' }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-[26px]">
      {risk === 'safe' && <circle cx="12" cy="12" r="6" fill="#E8B931" />}
      {risk === 'watch' && (
        <>
          <circle cx="15" cy="9" r="4.5" fill="#E8B931" />
          <path d="M5 16h11a3.5 3.5 0 0 0 0-7 5 5 0 0 0-9.5 1.5A2.8 2.8 0 0 0 5 16z" fill="#9AA9A5" />
          <rect x="4" y="18.5" width="14" height="2" rx="1" fill="#9AA9A5" />
        </>
      )}
      {risk === 'danger' && (
        <>
          <path d="M5 13h12a3.5 3.5 0 0 0 0-7 5 5 0 0 0-9.5 1.5A2.8 2.8 0 0 0 5 13z" fill="#4D666B" />
          <path d="M8 16l-1.5 4M12 16l-1.5 4M16 16l-1.5 4" stroke="#1F5F6B" strokeWidth="2" strokeLinecap="round" />
        </>
      )}
    </svg>
  )
}

/* Camera viewfinder: blurred field background + framed potato leaf with lesions. */
export function ViewfinderBackdrop() {
  return (
    <svg aria-hidden="true" viewBox="0 0 366 540" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
      <ellipse cx="40" cy="80" rx="90" ry="60" fill="#26341C" />
      <ellipse cx="320" cy="140" rx="110" ry="70" fill="#2A3A1F" />
      <ellipse cx="60" cy="420" rx="120" ry="80" fill="#2B2219" />
      <ellipse cx="330" cy="470" rx="120" ry="90" fill="#33271C" />
      <rect x="0" y="500" width="366" height="40" fill="#2B2219" />
    </svg>
  )
}

/* Just the dashed leaf frame from ViewfinderLeaf, drawn over the live camera. */
export function ViewfinderOutline({ className = '' }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 300 380" className={className}>
      <path d="M150 0 C 262 40 302 205 262 330 C 222 382 78 382 38 330 C -2 205 38 40 150 0 Z" fill="none" stroke="#E8B931" strokeWidth="3" strokeDasharray="11 8" strokeLinecap="round" />
    </svg>
  )
}

export function ViewfinderLeaf({ className = '' }: { className?: string }) {
  return (
    <svg role="img" aria-label="ক্যামেরায় একটি আলুর পাতা, পাতায় বাদামি দাগ" viewBox="0 0 300 380" className={className}>
      <path d="M150 0 C 262 40 302 205 262 330 C 222 382 78 382 38 330 C -2 205 38 40 150 0 Z" fill="none" stroke="#E8B931" strokeWidth="3" strokeDasharray="11 8" strokeLinecap="round" />
      <path d="M150 372 C 150 300 148 200 150 92" stroke="#3B6E2F" strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M150 18 C 194 36 200 112 150 142 C 100 112 106 36 150 18 Z" fill="#4E8A3E" />
      <path d="M150 30 V 136" stroke="#3B6E2F" strokeWidth="2" />
      <path d="M148 160 C 120 120 52 122 34 150 C 56 184 120 190 148 160 Z" fill="#558F43" />
      <path d="M152 160 C 180 120 248 122 266 150 C 244 184 180 190 152 160 Z" fill="#4E8A3E" />
      <path d="M148 240 C 122 206 64 206 46 232 C 66 262 122 266 148 240 Z" fill="#4E8A3E" />
      <path d="M152 240 C 178 206 236 206 254 232 C 234 262 178 266 152 240 Z" fill="#558F43" />
      <path d="M148 312 C 130 288 92 288 80 306 C 94 326 130 330 148 312 Z" fill="#558F43" />
      <path d="M152 312 C 170 288 208 288 220 306 C 206 326 170 330 152 312 Z" fill="#4E8A3E" />
      <path d="M146 160 L 40 151 M154 160 L 260 151 M146 240 L 52 232 M154 240 L 248 232" stroke="#3B6E2F" strokeWidth="1.6" />
      <ellipse cx="168" cy="72" rx="20" ry="16" fill="#A3B25A" />
      <path d="M156 66 C 162 56 180 58 182 70 C 186 82 170 88 162 84 C 154 80 152 72 156 66 Z" fill="#5B3A21" />
      <ellipse cx="84" cy="150" rx="17" ry="13" fill="#A3B25A" />
      <path d="M74 146 C 80 138 94 140 95 150 C 96 158 84 162 78 158 C 72 155 71 150 74 146 Z" fill="#5B3A21" />
      <ellipse cx="214" cy="234" rx="15" ry="12" fill="#A3B25A" />
      <path d="M206 230 C 210 223 222 225 223 234 C 224 241 214 244 209 241 C 204 238 203 234 206 230 Z" fill="#5B3A21" />
    </svg>
  )
}

/* The farmer's photo thumbnail on the uncertain-result screen. */
export function PhotoLeaf() {
  return (
    <svg role="img" aria-label="আপনার তোলা পাতার ছবি" viewBox="0 0 60 70" className="h-[70px] w-[60px]">
      <path d="M30 4 C 50 14 52 46 30 62 C 8 46 10 14 30 4 Z" fill="#4E8A3E" />
      <path d="M30 10 V 60" stroke="#3B6E2F" strokeWidth="1.5" />
      <ellipse cx="36" cy="26" rx="9" ry="7" fill="#A3B25A" />
      <path d="M31 24 C 33 19 41 20 42 26 C 43 31 36 33 33 31 C 30 29 30 26 31 24 Z" fill="#5B3A21" />
      <ellipse cx="22" cy="44" rx="6" ry="5" fill="#A3B25A" />
      <path d="M19 43 C 20 40 25 40 26 44 C 26 47 22 48 20 47 C 18 46 18 44 19 43 Z" fill="#5B3A21" />
    </svg>
  )
}

/* Reference thumbnails for each class the model can name (by class id); other ids get a plain leaf. */
export function CandidateThumb({ id }: { id: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 56 56" className="size-14 shrink-0 rounded-[14px] bg-[#EEF3E6]">
      {id === 'late_blight' && (
        <>
          <path d="M6 44 C 10 16 38 6 50 8 C 50 32 36 50 6 44 Z" fill="#4E8A3E" />
          <ellipse cx="30" cy="27" rx="11" ry="9" fill="#A3B25A" />
          <path d="M23 25 C 26 18 36 19 37 27 C 38 33 30 35 26 33 C 22 31 21 28 23 25 Z" fill="#4A2E1A" />
        </>
      )}
      {id === 'early_blight' && (
        <>
          <path d="M6 44 C 10 16 38 6 50 8 C 50 32 36 50 6 44 Z" fill="#4E8A3E" />
          <circle cx="29" cy="28" r="10" fill="#7A5434" />
          <circle cx="29" cy="28" r="7" fill="none" stroke="#3E2817" strokeWidth="1.6" />
          <circle cx="29" cy="28" r="3.5" fill="none" stroke="#3E2817" strokeWidth="1.6" />
        </>
      )}
      {id !== 'late_blight' && id !== 'early_blight' && (
        <>
          <path d="M6 44 C 10 16 38 6 50 8 C 50 32 36 50 6 44 Z" fill="#4E8A3E" />
          <path d="M8 43 L 46 11" stroke="#3B6E2F" strokeWidth="1.5" />
        </>
      )}
    </svg>
  )
}

const ANSWER_LEAF = 'M10 104 C 20 34 100 12 142 14 C 142 72 100 114 10 104 Z'
const ANSWER_LESION = 'M52 60 C 56 40 90 36 102 52 C 112 66 96 82 78 80 C 62 82 48 74 52 60 Z'
const SPORE_DOTS: [number, number, number][] = [
  [50, 56, 5], [56, 44, 5.5], [68, 36, 5], [84, 34, 5.5], [98, 40, 5], [106, 54, 5.5],
  [104, 68, 5], [94, 80, 5.5], [78, 86, 5], [62, 82, 5.5], [50, 70, 5],
]

/* Picture answers for the two narrowing questions. */
export function AnswerArt({ kind }: { kind: 'rings' | 'plain' | 'spores' | 'noSpores' }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 150 120" className="h-[124px] w-full rounded-[14px] bg-[#EEF3E6]">
      {kind === 'rings' && (
        <>
          <path d={ANSWER_LEAF} fill="#4E8A3E" />
          <circle cx="78" cy="62" r="27" fill="#7A5434" />
          {[20, 13, 6].map((r) => (
            <circle key={r} cx="78" cy="62" r={r} fill="none" stroke="#3E2817" strokeWidth="2" />
          ))}
        </>
      )}
      {kind === 'plain' && (
        <>
          <path d={ANSWER_LEAF} fill="#4E8A3E" />
          <ellipse cx="80" cy="60" rx="34" ry="26" fill="#A3B25A" />
          <path d="M54 58 C 58 40 88 36 100 50 C 110 64 96 80 80 78 C 64 80 50 72 54 58 Z" fill="#4A2E1A" />
        </>
      )}
      {(kind === 'spores' || kind === 'noSpores') && (
        <>
          <path d={ANSWER_LEAF} fill="#8DB86E" />
          <path d={ANSWER_LESION} fill="#6B4A30" />
          {kind === 'spores' && (
            <g fill="#FFFFFF">
              {SPORE_DOTS.map(([cx, cy, r]) => (
                <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} />
              ))}
            </g>
          )}
        </>
      )}
    </svg>
  )
}

/* Magnifier over an unfamiliar leaf for the "can't identify" screen. */
export function UnknownArt() {
  return (
    <svg aria-hidden="true" viewBox="0 0 220 190" className="h-[190px] w-[220px]">
      <circle cx="110" cy="95" r="88" fill="#EFE6D4" />
      <circle cx="110" cy="95" r="78" fill="none" stroke="#C4A979" strokeWidth="2" strokeDasharray="7 6" />
      <path d="M96 30 C 140 46 146 116 96 150 C 46 116 52 46 96 30 Z" fill="#6E9A45" />
      <path d="M96 40 V 146" stroke="#4E7A35" strokeWidth="2" />
      <circle cx="84" cy="74" r="7" fill="#8B7FA6" />
      <circle cx="108" cy="96" r="5" fill="#8B7FA6" />
      <circle cx="86" cy="118" r="6" fill="#8B7FA6" />
      <circle cx="112" cy="66" r="4" fill="#8B7FA6" />
      <circle cx="148" cy="122" r="30" fill="#FBF6EC" stroke="#2B1E16" strokeWidth="7" />
      <path d="M170 144 L 192 166" stroke="#2B1E16" strokeWidth="10" strokeLinecap="round" />
      <path d="M139 113 a 9 9 0 0 1 17 3 c 0 6 -8 7 -8 13" fill="none" stroke="#C2412D" strokeWidth="5" strokeLinecap="round" />
      <circle cx="148" cy="137" r="3.2" fill="#C2412D" />
    </svg>
  )
}
