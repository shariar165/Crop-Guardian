import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { AnswerRecord } from '@/lib/captureStore'
import { belongsOn, finalOf, screenFor } from '@/lib/diagnosis/flow'
import { answerLine, nextQuestion, QUESTIONS, questionCount, remainingAfter } from '@/lib/diagnosis/questions'
import { fixtureDiagnosis, realConfig } from '@/lib/diagnosis/__fixtures__'

const [EARLY, HEALTHY, LATE] = realConfig.diseases
const ans = (question: string, answer: AnswerRecord['answer']): AnswerRecord => ({ question, answer })

describe('the question bank', () => {
  it('only rules out classes the model knows', () => {
    for (const q of QUESTIONS) {
      for (const id of [...q.rulesOut.yes, ...q.rulesOut.no]) assert.ok(realConfig.diseases.includes(id), `${q.id}: ${id}`)
    }
  })
})

describe('nextQuestion', () => {
  it('asks about rings to split early from late blight', () => {
    assert.equal(nextQuestion([LATE, EARLY], [])?.id, 'rings')
    assert.deepEqual(remainingAfter([LATE, EARLY], [ans('rings', 'yes')]), [EARLY])
    assert.deepEqual(remainingAfter([LATE, EARLY], [ans('rings', 'no')]), [LATE])
  })

  it('skips the rings question when it cannot split late blight from healthy', () => {
    assert.equal(nextQuestion([LATE, HEALTHY], [])?.id, 'spores')
    assert.equal(questionCount([LATE, HEALTHY], []), 1)
    assert.deepEqual(remainingAfter([LATE, HEALTHY], [ans('spores', 'no')]), [HEALTHY])
  })

  it('splits early blight from healthy with the rings question', () => {
    assert.equal(nextQuestion([EARLY, HEALTHY], [])?.id, 'rings')
    assert.deepEqual(remainingAfter([EARLY, HEALTHY], [ans('rings', 'no')]), [HEALTHY])
  })

  it('asks both questions when all three are left, and stops once one is left', () => {
    const all = [EARLY, HEALTHY, LATE]
    assert.equal(questionCount(all, []), 2)
    assert.equal(nextQuestion(all, [ans('rings', 'yes')]), null)
    assert.equal(nextQuestion(all, [ans('rings', 'no')])?.id, 'spores')
    assert.deepEqual(remainingAfter(all, [ans('rings', 'no'), ans('spores', 'yes')]), [LATE])
  })

  it('rules nothing out for "জানি না" and moves on', () => {
    assert.deepEqual(remainingAfter([LATE, EARLY], [ans('rings', 'unsure')]), [LATE, EARLY])
    assert.equal(nextQuestion([LATE, EARLY], [ans('rings', 'unsure')])?.id, 'spores')
    assert.equal(nextQuestion([LATE, EARLY], [ans('rings', 'unsure'), ans('spores', 'unsure')]), null)
  })

  it('can be left with nothing when the answers contradict the photos', () => {
    assert.deepEqual(remainingAfter([LATE, EARLY], [ans('rings', 'yes'), ans('spores', 'yes')]), [])
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
  assert.equal(answerLine(ans('spores', 'yes')), 'আপনার উত্তর: পাতার নিচে সাদা তুলার মতো কিছু আছে')
  assert.equal(answerLine(ans('rings', 'unsure')), 'আপনার উত্তর: দাগের ভেতরে চাকতির মতো রিং আছে কি না জানা নেই')
})
