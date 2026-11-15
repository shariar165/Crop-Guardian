// Dated reports of potato late blight in Bangladesh, 2016–17 to 2024–25, for the backtest
// (scripts/outbreak-humidity.ts). Each entry records what its text says, read from the page itself:
// when it was published, the places it puts the disease in, and the earliest date of disease the
// text implies, with the words that date rests on. Without such words it is the publication (or
// dateline) date, which is later than the disease: reports lag it.
//
// Kinds: 'outbreak' reports disease in fields; 'little' reports that it has not spread much;
// 'warning' says the weather favours it, without reporting disease. No report for a winter is not
// evidence that there was no disease. Doses and brand names in the sources are left out (tested).

export type ReportKind = 'outbreak' | 'little' | 'warning'

// A place the text names: the app's area id (an upazila, or a district) when the app covers it.
export type ReportPlace = { name: string; area: string | null }

export type BlightReport = {
  id: string
  kind: ReportKind
  source: string
  title: string
  // YYYY-MM-DD
  published: string
  url: string
  places: ReportPlace[]
  // Other districts the text names, less specifically.
  alsoNamed: string[]
  earliest: string
  // The text's own words for `earliest`, or how it was chosen.
  basis: string
}

export const BLIGHT_REPORTS: BlightReport[] = [
  {
    id: 'ds-2017-01-21',
    kind: 'outbreak',
    source: 'The Daily Star',
    title: 'Farmers frown at fungal attack',
    published: '2017-01-21',
    url: 'https://www.thedailystar.net/backpage/farmers-frown-fungal-attack-1349017',
    places: [
      { name: 'Parbatipur, Dinajpur (Uttar Bhajanpur)', area: 'dinajpur-parbatipur' },
      { name: 'Taraganj, Rangpur (Jhanjira)', area: 'rangpur-taraganj' },
      { name: 'Ishwardi, Pabna (Muladuli)', area: 'pabna-ishwardi' },
    ],
    alsoNamed: ['Rangpur', 'Dinajpur', 'Naogaon', 'Lalmonirhat', 'Kurigram', 'Rajshahi', 'Bogra', 'Mymensingh', 'Kishoreganj', 'Pabna'],
    earliest: '2017-01-11',
    basis: '"after a spell of rain on January 10"',
  },
  {
    id: 'fe-2018-01-04',
    kind: 'outbreak',
    source: 'The Financial Express',
    title: 'Potato growers take a hit from late blight disease in Rangpur',
    published: '2018-01-04',
    url: 'https://thefinancialexpress.com.bd/print/potato-growers-take-a-hit-from-late-blight-disease-in-rangpur-1515005470',
    places: [{ name: 'Mithapukur, Rangpur (Tilakpara)', area: 'rangpur-mithapukur' }],
    alsoNamed: [],
    earliest: '2018-01-04',
    basis: 'publication date ("this season", "gradually turning acute"; no start date)',
  },
  {
    id: 'fe-2018-01-14',
    kind: 'outbreak',
    source: 'The Financial Express',
    title: 'Late blight disease breaks out in Nilphamari',
    published: '2018-01-14',
    url: 'https://thefinancialexpress.com.bd/print/late-blight-disease-breaks-out-in-nilphamari-1515925814',
    places: [{ name: 'Nilphamari', area: 'nilphamari' }],
    alsoNamed: [],
    earliest: '2018-01-14',
    basis: 'publication date (no start date)',
  },
  {
    id: 'fe-2018-01-15',
    kind: 'outbreak',
    source: 'The Financial Express',
    title: 'Late blight disease worries Nilphamari, Joypurhat cultivators',
    published: '2018-01-15',
    url: 'https://today.thefinancialexpress.com.bd/print/late-blight-disease-worries-nilphamari-joypurhat-cultivators-1515940907',
    places: [
      { name: 'Nilphamari Sadar (Itakhola)', area: 'nilphamari-sadar' },
      { name: 'Akkelpur, Joypurhat (Madipukur)', area: 'joypurhat-akkelpur' },
    ],
    alsoNamed: [],
    earliest: '2018-01-14',
    basis: 'dateline "Nilphamari, Jan 14" (no start date)',
  },
  {
    id: 'ds-2018-01-16',
    kind: 'outbreak',
    source: 'The Daily Star',
    title: 'Late blight dashes hope',
    published: '2018-01-16',
    url: 'https://www.thedailystar.net/country/potato-growers-farmers-in-dinajpur-and-rangpur-bangladesh-late-blight-dashes-hope-1520854',
    places: [
      { name: 'Badarganj, Rangpur (Kalupara)', area: 'rangpur-badarganj' },
      { name: 'Biral, Dinajpur (Polashbari)', area: 'dinajpur-birol' },
      { name: 'Gangachara, Rangpur (Teesta char)', area: 'rangpur-gangachara' },
      { name: 'Rangpur Sadar (Mominpur)', area: 'rangpur-sadar' },
    ],
    alsoNamed: [],
    earliest: '2018-01-01',
    basis: 'a Badarganj farmer "noticed the late blight infection in his field 15 days ago"',
  },
  {
    id: 'ds-2020-01-21',
    kind: 'outbreak',
    source: 'The Daily Star',
    title: 'Late blight attack worries potato growers',
    published: '2020-01-21',
    url: 'https://www.thedailystar.net/country/news/late-blight-attack-worries-potato-growers-1857268',
    places: [
      { name: 'Thakurgaon Sadar', area: 'thakurgaon-sadar' },
      { name: 'Boda, Panchagarh', area: 'panchagarh-boda' },
    ],
    alsoNamed: [],
    earliest: '2020-01-21',
    basis: 'publication date ("ongoing prolonged cold and dense fog"; no start date)',
  },
  {
    id: 'na-2020-02-02',
    kind: 'outbreak',
    source: 'New Age',
    title: 'Late blight attack worries potato farmers in northern districts',
    published: '2020-02-02',
    url: 'https://www.newagebd.net/article/98379/late-blight-attack-worries-potato-farmers-in-northern-districts',
    places: [{ name: 'Lalmonirhat (Shail Khowa)', area: 'lalmonirhat' }],
    alsoNamed: ['Rangpur', 'Kurigram', 'Gaibandha', 'Dinajpur', 'Nilphamari', 'Thakurgaon', 'Panchagarh'],
    earliest: '2020-02-02',
    basis: 'publication date (no start date)',
  },
  {
    id: 'bamis-2023-01-09',
    kind: 'warning',
    source: 'BAMIS (DAE), Special Agromet Advisory for Cold Wave',
    title: 'Current weather conditions may attack potato late blight',
    published: '2023-01-09',
    url: 'https://www.bamis.gov.bd/res/public/pages/2023/01/11/25588.pdf',
    places: [],
    alsoNamed: [
      'Tangail', 'Faridpur', 'Manikganj', 'Jashore', 'Chuadanga', 'Satkhira', 'Kushtia', 'Rajshahi', 'Naogaon', 'Natore', 'Chapainawabganj', 'Bogra',
      'Pabna', 'Sirajganj', 'Joypurhat', 'Rangpur', 'Gaibandha', 'Kurigram', 'Nilphamari', 'Lalmonirhat', 'Dinajpur', 'Thakurgaon', 'Panchagarh',
    ],
    earliest: '2023-01-09',
    basis: 'issue date',
  },
  {
    id: 'bamis-2024-01-03',
    kind: 'warning',
    source: 'BAMIS (DAE), National Bulletin, 3–7 Jan 2024',
    title: 'Present weather condition is congenial for Late Blight infestation',
    published: '2024-01-03',
    url: 'https://www.bamis.gov.bd/en/bulletin/view/32939/',
    places: [],
    alsoNamed: ['all 14 agricultural regions'],
    earliest: '2024-01-03',
    basis: 'issue date',
  },
  {
    id: 'fe-2024-01-18',
    kind: 'outbreak',
    source: 'The Financial Express',
    title: 'Crop failure feared as late blight attacks potato fields in Rangpur',
    published: '2024-01-19',
    url: 'https://thefinancialexpress.com.bd/national/country/crop-failure-feared-as-late-blight-attacks-potato-fields-in-rangpur',
    places: [
      { name: 'Rangpur Sadar (Benughat)', area: 'rangpur-sadar' },
      { name: 'Taraganj, Rangpur (Alampur)', area: 'rangpur-taraganj' },
    ],
    alsoNamed: [],
    earliest: '2024-01-18',
    basis: 'dateline "RANGPUR, Jan 18" ("the affected areas are increasing day by day"; no start date)',
  },
  {
    id: 'tbs-2024-01-20',
    kind: 'outbreak',
    source: 'The Business Standard',
    title: 'Farmers fear losses as Boro, potato seeds rot in biting cold',
    published: '2024-01-20',
    url: 'https://www.tbsnews.net/node/778054',
    places: [
      { name: 'Bogura (DAE: late blight "also occurring")', area: 'bogura' },
      { name: 'Joypurhat ("recent outbreak", in its section)', area: 'joypurhat' },
    ],
    alsoNamed: [],
    earliest: '2024-01-20',
    basis: 'publication date ("recent outbreak"; no start date)',
  },
  {
    id: 'ds-2024-01-24',
    kind: 'little',
    source: 'The Daily Star',
    title: 'Winter chills bite farming hard',
    published: '2024-01-24',
    url: 'https://www.thedailystar.net/node/3527581',
    places: [{ name: 'Rajshahi (DAE: "have not affected many potato farms")', area: 'rajshahi' }],
    alsoNamed: [],
    earliest: '2024-01-24',
    basis: 'publication date',
  },
  {
    id: 'fe-2024-02-04',
    kind: 'outbreak',
    source: 'The Financial Express',
    title: 'Late blight disease dampens potato prospects for Gaibandha, Chandpur',
    published: '2024-02-04',
    url: 'https://today.thefinancialexpress.com.bd/print/late-blight-disease-dampens-potato-prospects-for-gaibandhachandpur-1706974071',
    places: [
      { name: 'Gaibandha (seven upazilas)', area: 'gaibandha' },
      { name: 'Hatibandha, Lalmonirhat (0.37 ha)', area: 'lalmonirhat-hatibandha' },
      { name: 'Haimchar, Chandpur', area: null },
    ],
    alsoNamed: [],
    earliest: '2024-02-04',
    basis: 'publication date (Gaibandha: "Dense fog amid intense cold for the past few days"; no start date)',
  },
  {
    id: 'ob-2024-12-28',
    kind: 'warning',
    source: 'The Daily Observer',
    title: 'Severe cold, fog threaten our agriculture',
    published: '2024-12-28',
    url: 'https://observerbd.com/news/504751',
    places: [],
    alsoNamed: ['Bogra', 'Rajshahi', 'Joypurhat', 'Rangpur'],
    earliest: '2024-12-28',
    basis: 'publication date (a press piece on the risk, no field named)',
  },
  {
    id: 'fe-2025-02-04',
    kind: 'outbreak',
    source: 'The Financial Express',
    title: "Late blight disease dampens farmers' hope of a good yield in Rangpur",
    published: '2025-02-04',
    url: 'https://thefinancialexpress.com.bd/trade/late-blight-disease-dampens-farmers-hope-of-a-good-yield-in-rangpur',
    places: [
      { name: 'Mithapukur, Rangpur (Jaigirhat)', area: 'rangpur-mithapukur' },
      { name: 'Nilphamari Sadar (Charaikhola)', area: 'nilphamari-sadar' },
    ],
    alsoNamed: ['Rangpur', 'Kurigram', 'Lalmonirhat', 'Gaibandha', 'Nilphamari'],
    earliest: '2025-02-04',
    basis: 'publication date (after "cold and foggy weather prevailing for more than one week"; no start date)',
  },
]

// The winter a date belongs to, by the year its December falls in: 2024-01-18 → 2023.
export const winterOf = (date: string): number => (Number(date.slice(5, 7)) >= 7 ? Number(date.slice(0, 4)) : Number(date.slice(0, 4)) - 1)
