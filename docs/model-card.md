# Model card: Crop Guardian leaf diagnosis (v2)

The on-device model that looks at potato leaf photos. The paddy model has its own card, `docs/model-card-paddy.md`, written by [`notebooks/paddy_training.ipynb`](../notebooks/paddy_training.ipynb) with every number from its own run (see [Paddy diagnosis](../README.md#paddy-diagnosis)); it is not trained yet. It is one part of the app: the weather risk and the SMS alerts use no ML (see the [README](../README.md)).

> **Status: draft.** The sections marked **⏳ from the notebook** still need the training notebook's numbers. Nothing in this card is estimated; every number either comes from the files in this repo or will be copied from the notebook's output.

## At a glance

| | |
|---|---|
| Task | Classify one potato leaf photo as early blight, healthy or late blight, or say "unknown" |
| Architecture | EfficientNet-B0, fine-tuned, exported to ONNX (`public/model/crop_guardian_v2.onnx`) |
| Runs | In the browser, on the phone (onnxruntime-web, wasm, one thread). No photo leaves the phone. |
| Input | RGB, shorter side resized to 255, centre crop 224 × 224, ImageNet mean/std, NCHW float32 |
| Outputs | 4 logits: `early_blight`, `healthy`, `late_blight`, `other` (the last is used only to detect unknown inputs) |
| Bengali labels | আগাম ধসা, সুস্থ, নাবি ধসা, অন্য রোগ |
| Training notebook | ⏳ link |

## Data

**⏳ from the notebook:** source and licence, the number of photos per class, and the train/validation/calibration/test splits.

- **Training data: Potato Leaf Disease Dataset in Uncontrolled Environment.** These are photos of leaves taken in real fields, with soil, other leaves, uneven light and shadows in the frame. We chose it over PlantVillage, the usual benchmark, because PlantVillage photographs single leaves on a plain background in a lab. Models trained on PlantVillage are known to lose much of their accuracy on field photos, and a farmer's phone photo is a field photo.
- **Calibration data: an Indonesian field split** (`provenance` in the config: "thresholds fitted on Indonesian field-cal split"). The temperature, conformal threshold and OOD threshold were fitted on it. It is still not Bangladeshi data (see [Limitations](#limitations)).
- **"Other" class and unseen diseases:** the OOD check was tested leave-class-out (notebook 03): some disease classes were held out of training entirely, to measure whether the model says "unknown" for diseases it has never seen.

## How the app decides

All of these come from `public/model/crop_guardian_config.json`. The app reads them and never hard-codes them (`src/lib/diagnosis/decide.ts`).

| Step | Setting |
|---|---|
| Temperature scaling | T = 1.919, applied to the 3 disease logits |
| Conformal prediction set | α = 0.1, q̂ = 0.1126. A class is in the set when its probability is ≥ 1 − q̂ ≈ 0.887. |
| Out-of-distribution | `p_other`: softmax over all 4 logits, the "other" share. Unknown when it is > 0.99935. |
| Result | **unknown** if OOD or the set is empty; **confident** with one class in the set; **uncertain** with more than one |

With 1 − q̂ ≈ 0.89, the set can never hold two classes for one photo, so a single photo is either confident or unknown. "Uncertain" comes from the two photos (top and underside) disagreeing (`combine.ts`, where the more cautious result wins), and the farmer's answers to the questions then narrow it down.

## Test results

**⏳ from the notebook** for each item:

- **Accuracy and macro-F1** on the held-out test split, plus precision, recall and F1 per class
- **Confusion matrix** (3 × 3, test split)
- **Calibration:** expected calibration error (ECE) before and after temperature scaling
- **Conformal coverage at α = 0.1:** the share of test photos whose set contains the true class (the target is ≥ 90%), the average set size, and the share of confident, uncertain and unknown answers
- **OOD (leave-class-out):** AUROC of the `p_other` score; the share of unseen-disease photos called unknown; the share of known-class photos wrongly called unknown

## Checks in this repo

These are reproducible from the repo today.

- **App = notebook.** `src/lib/diagnosis/__fixtures__/parity/` has 12 images with the notebook's logits and decisions: 4 healthy, 4 late blight, and 4 diseases the model never saw. `parity.test.ts` runs the real ONNX model in Node through the app's own preprocessing and gets the **same decision and candidates for all 12** (the logits drift by 0.1–0.25 because the image resizing isn't bit-identical).
- **What those 12 show.** The 8 known leaves are all confident and correct. Of the 4 unseen diseases, **3 are called unknown and 1 is called late blight with confidence**, in the notebook as well as the app. That is 12 images, too few to be a rate, but it shows the OOD check is not perfect.
- **Field-photo test.** `npx tsx scripts/eval-field-photos.ts <dir> --write` runs any folder of labelled photos through the same code and writes `docs/field-photo-test.md`. It has not been run on Bangladeshi field photos yet.

## Limitations

- **Thresholds fitted on Indonesian field photos, not Bangladeshi ones.** Every result in the app therefore says "পরীক্ষামূলক: ইন্দোনেশিয়ার মাঠের ছবিতে যাচাই করা". The next step is 20–30 photos from Bangladeshi fields, labelled by an agriculture officer, run through `scripts/eval-field-photos.ts`.
- **Only three classes.** Other diseases and pests should come out as unknown and go to an officer, but as the parity images show, some will not.
- **Potato only.** Paddy leaves are not recognised; the app says so on paddy screens.
- **One photo is decided at a time**, and two photos are combined by a fixed rule (`combine.ts`), not by a model calibrated on photo pairs.
