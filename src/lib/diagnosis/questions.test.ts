import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { AnswerRecord } from '@/lib/captureStore'
import { belongsOn, finalOf, screenFor } from '@/lib/diagnosis/flow'
import { answerLine, nextQuestion, QUESTIONS, questionCount, remainingAfter } from '@/lib/diagnosis/questions'
import { CROP_IDS } from '@/lib/crops'
import { classesOf } from '@/lib/diagnosis/crops'
import { fixtureDiagnosis, realConfig } from '@/lib/diagnosis/__fixtures__'

const [EARLY, HEALTHY, LATE] = realConfig.diseases
const ans = (question: string, answer: AnswerRecord['answer']): AnswerRecord => ({ question, answer })

describe('the question bank', () => {
  it("only rules out each crop's own classes", () => {
    for (const crop of CROP_IDS) {
      const classes = classesOf(crop)
      for (const q of QUESTIONS[crop]) {
        for (const id of [...q.rulesOut.yes, ...q.rulesOut.no]) assert.ok(classes.includes(id), `${crop} ${q.id}: ${id}`)
      }
    }
  })

  it('has question ids unique across crops, since answers are stored by id', () => {
    const ids = CROP_IDS.flatMap((c) => QUESTIONS[c].map((q) => q.id))
    assert.equal(new Set(ids).size, ids.length)
  })

  it('can narrow any two paddy classes down to one', () => {
    const classes = classesOf('paddy')
    for (const a of classes) {
      for (const b of classes.filter((x) => x > a)) {
        const q = nextQuestion([a, b], [], 'paddy')
        assert.ok(q, `${a} / ${b}: no question splits them`)
        const yes = remainingAfter([a, b], [{ question: q.id, answer: 'yes' }], 'paddy')
        const no = remainingAfter([a, b], [{ question: q.id, answer: 'no' }], 'paddy')
        assert.ok(yes.length === 1 || no.length === 1, `${a} / ${b} via ${q.id}`)
      }
    }
  })
})

describe('paddy questions', () => {
  it('rules out blast when the spots are not eye-shaped', () => {
    assert.equal(nextQuestion(['blast', 'brown_spot'], [], 'paddy')?.id, 'rice_eye')
    assert.deepEqual(remainingAfter(['blast', 'brown_spot'], [ans('rice_eye', 'no')], 'paddy'), ['brown_spot'])
    assert.deepEqual(remainingAfter(['blast', 'brown_spot'], [ans('rice_eye', 'yes')], 'paddy'), ['blast'])
  })

  it('asks first whether there is any symptom when healthy is a candidate', () => {
    assert.equal(nextQuestion(['healthy', 'tungro'], [], 'paddy')?.id, 'rice_symptom')
    assert.deepEqual(remainingAfter(['healthy', 'tungro'], [ans('rice_symptom', 'no')], 'paddy'), ['healthy'])
  })

  it("never asks about a disease that isn't a candidate", () => {
    const left = ['bacterial_leaf_blight', 'tungro', 'sheath_blight', 'healthy']
    const asked = []
    for (let q = nextQuestion(left, [], 'paddy'), answers: AnswerRecord[] = []; q; q = nextQuestion(left, answers, 'paddy')) {
      asked.push(q.id)
      answers = [...answers, { question: q.id, answer: 'unsure' }]
    }
    assert.ok(!asked.includes('rice_eye'), asked.join())
    assert.equal(questionCount(left, [], 'paddy'), 4)
  })

  it('every paddy question names the class it is about, and rules that class out on "no"', () => {
    for (const q of QUESTIONS.paddy) {
      assert.ok(q.about && classesOf('paddy').includes(q.about), q.id)
      assert.ok(q.rulesOut.no.includes(q.about!) || q.about === 'healthy', q.id)
    }
  })

  it('ignores answers to the other crop’s questions', () => {
    assert.deepEqual(remainingAfter(['blast', 'tungro'], [ans('rings', 'yes')], 'paddy'), ['blast', 'tungro'])
    assert.equal(answerLine(ans('rings', 'yes'), 'paddy'), null)
  })
})

describe('nextQuestion', () => {
  it('asks about rings to split early from late blight', () => {
    assert.equal(nextQuestion([LATE, EARLY], [], 'potato')?.id, 'rings')
    assert.deepEqual(remainingAfter([LATE, EARLY], [ans('rings', 'yes')], 'potato'), [EARLY])
    assert.deepEqual(remainingAfter([LATE, EARLY], [ans('rings', 'no')], 'potato'), [LATE])
  })

  it('skips the rings question when it cannot split late blight from healthy', () => {
    assert.equal(nextQuestion([LATE, HEALTHY], [], 'potato')?.id, 'spores')
    assert.equal(questionCount([LATE, HEALTHY], [], 'potato'), 1)
    assert.deepEqual(remainingAfter([LATE, HEALTHY], [ans('spores', 'no')], 'potato'), [HEALTHY])
  })

  it('splits early blight from healthy with the rings question', () => {
    assert.equal(nextQuestion([EARLY, HEALTHY], [], 'potato')?.id, 'rings')
    assert.deepEqual(remainingAfter([EARLY, HEALTHY], [ans('rings', 'no')], 'potato'), [HEALTHY])
  })

  it('asks both questions when all three are left, and stops once one is left', () => {
    const all = [EARLY, HEALTHY, LATE]
    assert.equal(questionCount(all, [], 'potato'), 2)
    assert.equal(nextQuestion(all, [ans('rings', 'yes')], 'potato'), null)
    assert.equal(nextQuestion(all, [ans('rings', 'no')], 'potato')?.id, 'spores')
    assert.deepEqual(remainingAfter(all, [ans('rings', 'no'), ans('spores', 'yes')], 'potato'), [LATE])
  })

  it('rules nothing out for "জানি না" and moves on', () => {
    assert.deepEqual(remainingAfter([LATE, EARLY], [ans('rings', 'unsure')], 'potato'), [LATE, EARLY])
    assert.equal(nextQuestion([LATE, EARLY], [ans('rings', 'unsure')], 'potato')?.id, 'spores')
    assert.equal(nextQuestion([LATE, EARLY], [ans('rings', 'unsure'), ans('spores', 'unsure')], 'potato'), null)
  })

  it('can be left with nothing when the answers contradict the photos', () => {
    assert.deepEqual(remainingAfter([LATE, EARLY], [ans('rings', 'yes'), ans('spores', 'yes')], 'potato'), [])
  })
})

describe('finalOf and the screen for a diagnosis', () => {
  it('takes a confident photo result as final', () => {
    const r = fixtureDiagnosis('confident', realConfig)
    assert.deepEqual(finalOf(r), { id: LATE, via: 'model' })
    assert.equal(screenFor(r), '/result')
  })

  it('takes the one class the answers left, marked as from the questions', () => {
    const r = { ...fixtureDiagnosis('uncertain', realConfig), answers: [ans('rings', 'no')] }
    assert.deepEqual(finalOf(r), { id: LATE, via: 'questions' })
    assert.ok(belongsOn('/result', r))
    assert.ok(belongsOn('/result/uncertain', r))
  })

  it('has no final result while uncertain or unknown', () => {
    const u = fixtureDiagnosis('uncertain', realConfig)
    assert.equal(finalOf(u), null)
    assert.equal(screenFor(u), '/result/uncertain')
    assert.ok(!belongsOn('/result', u))
    assert.ok(belongsOn('/questions', u))
    const x = fixtureDiagnosis('unknown', realConfig)
    assert.equal(screenFor(x), '/unknown')
    assert.ok(!belongsOn('/questions', x))
  })
})

it('words the farmer’s answer for the "why" list', () => {
  assert.equal(answerLine(ans('spores', 'yes'), 'potato'), 'আপনার উত্তর: পাতার নিচে সাদা তুলার মতো কিছু আছে')
  assert.equal(answerLine(ans('rings', 'unsure'), 'potato'), 'আপনার উত্তর: দাগের ভেতরে চাকতির মতো রিং আছে কি না জানা নেই')
})
