# Parity fixtures

Reference outputs from the training notebook, used by `decide.test.ts` and `parity.test.ts` to check that the app makes the same decisions as the notebook. Exported from `runs/04_export/parity` on the project Drive; both tests are skipped if `expected.json` is empty.

Put the leaf images in this folder and list them in `expected.json`:

```json
[
  {
    "file": "late_blight_0.jpg",
    "group": "late_blight",
    "source": "Potato Leaf Disease Dataset in Uncontrolled Environment/Phytopthora/1692332350385.jpg",
    "logits": [-1.2, 0.3, 4.8, -2.0],
    "decision": "confident",
    "candidates": ["late_blight"],
    "probs": [0.01, 0.03, 0.96],
    "ood_score": 0.002
  }
]
```

- `file`: the image in this folder. `group` (where it was drawn from) and `source` (its dataset path) are informational.
- `logits`: the raw model output for all 4 classes, in `classes` order from `public/model/crop_guardian_config.json`, computed with the notebook's own preprocessing.
- `decision`: `confident`, `uncertain` or `unknown`, from the rules in `config.decision`.
- `candidates`: class ids in the decision set, sorted by probability, highest first (`[]` for `unknown`).
- `probs` and `ood_score` are optional. When present they are checked to within 1e-4, since the notebook rounds them to 4 decimals.

`parity.test.ts` re-runs the model on the images, so logits drift a little from the notebook's (its resizing is not bit-identical; about 0.1–0.25 today). Only the decisions and candidates must match.
