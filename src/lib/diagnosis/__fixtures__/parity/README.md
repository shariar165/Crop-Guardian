# Parity fixtures

Reference outputs from the training notebook, used by `decide.test.ts` and `parity.test.ts` to check that the app makes the same decisions as the notebook. Both tests are skipped while `expected.json` is empty.

Put the leaf images in this folder and list them in `expected.json`:

```json
[
  {
    "image": "late_blight_01.jpg",
    "logits": [-1.2, 0.3, 4.8, -2.0],
    "decision": "confident",
    "candidates": ["late_blight"],
    "probs": [0.01, 0.03, 0.96],
    "ood_score": 0.002
  }
]
```

- `logits`: the raw model output for all 4 classes, in `classes` order from `public/model/crop_guardian_config.json`, computed with the notebook's own preprocessing.
- `decision`: `confident`, `uncertain` or `unknown`, from the rules in `config.decision`.
- `candidates`: class ids in the decision set, sorted by probability, highest first (`[]` for `unknown`).
- `probs` and `ood_score` are optional. When present they are checked to within 1e-5.

Aim for 10–20 images covering every class, including some the model should call `unknown`.
