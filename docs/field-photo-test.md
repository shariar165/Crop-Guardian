# Field-photo test

## Photos

**67 photos from one BARI station (Chattogram)**, from the BARI Potato Leaf Disease Dataset ([Mendeley d5b3fzpw3g](https://data.mendeley.com/datasets/d5b3fzpw3g)), a dataset the model was not trained or calibrated on. **Every photo is pre-resized to 224×224**, and most are **canopy shots** (several leaves, weeds and soil in the frame), not the single-leaf close-up the app asks for. So this is one station's photos, a harder framing than the app's instructions, and a small sample: read the counts, not the percentages.

Only the dataset's `orig_*` files were used, not its augmented copies (`aug_*`: rotated, zoomed and shifted). Near-duplicate frames were grouped by perceptual hash (dHash, ≤ 12 of 64 bits) and one kept per group: healthy 4 of 16, late blight 18 of 20, unseen 45 of 48 (bacterial soft rot 7, leaf roll 31, PVX 5, PVY 2).

67 photos: healthy 4, late_blight 18, unseen 45. Sizes: all 224×224.

The app's photo diagnosis on 67 labelled photos from `data/bd-potato`, one photo at a time, with the real model and the app's own preprocessing and thresholds. Every photo goes to the model, including those the camera would have asked to retake; the camera's check is reported on its own.

## Headline

| Measure | Result |
|---|---|
| Misleading answers | 16 of 67 (24%) |
| Late blight caught (confident, or on the shortlist) | 2 of 18 (11%) |
| Unseen diseases called "unknown" | 34 of 45 (76%) |

## Model answers

| Folder | Photos | Right | Shortlist with the right answer | "Unknown" | Misleading |
|---|--:|--:|--:|--:|--:|
| healthy | 4 | 0 | 0 | 4 | 0 |
| late_blight | 18 | 2 | 0 | 11 | 5 |
| unseen | 45 | 34 | 0 | 0 | 11 |

**Misleading: 16 of 67 (24%)**: a confident wrong answer, a shortlist without the real disease, or an unseen disease not called "unknown". For `unseen`, "right" means the app said "unknown".

## Confident answers

| Truth \ App | early_blight | healthy | late_blight |
|---|--:|--:|--:|
| healthy | 0 | 0 | 0 |
| late_blight | 5 | 0 | 2 |
| unseen | 2 | 0 | 9 |

Confident answers that were right: 2 of 7.

## Camera quality check

**Not representative: pre-resized, not phone photos.** Every photo had its longer side under 1000 px before the check saw it, so these counts say little about a farmer's camera.

What the camera's check (`src/lib/imageQuality.ts`) would have said on each photo as a gallery upload: the whole photo scaled to the analysis width. A flagged photo can still be kept by the farmer.

| Folder | Photos | Would ask to retake | Too dark | Too bright | No leaf | Too far | Blurry |
|---|--:|--:|--:|--:|--:|--:|--:|
| healthy | 4 | 0 of 4 | 0 | 0 | 0 | 0 | 0 |
| late_blight | 18 | 0 of 18 (0%) | 0 | 0 | 0 | 0 | 0 |
| unseen | 45 | 0 of 45 (0%) | 0 | 0 | 0 | 0 | 0 |

Generated on 2026-11-20 by `npx tsx scripts/eval-field-photos.ts <dir> --write`.
