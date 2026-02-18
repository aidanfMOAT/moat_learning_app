import assert from 'node:assert/strict';
import test from 'node:test';
import { canAttempt, scoreQuiz } from '../src/lib/quiz';

test('scoreQuiz returns rounded percentage', () => {
  const score = scoreQuiz(
    [
      { id: 'q1', correctAnswer: 'True' },
      { id: 'q2', correctAnswer: 'A' },
      { id: 'q3', correctAnswer: 'B' }
    ],
    [
      { questionId: 'q1', answer: 'true' },
      { questionId: 'q2', answer: 'A' },
      { questionId: 'q3', answer: 'C' }
    ]
  );

  assert.equal(score, 67);
});

test('attempt limits allow unlimited when max is null', () => {
  assert.equal(canAttempt(100, null), true);
  assert.equal(canAttempt(0, undefined), true);
});

test('attempt limits block when reaching max', () => {
  assert.equal(canAttempt(2, 3), true);
  assert.equal(canAttempt(3, 3), false);
});
