'use client';

import React, { useState } from 'react';
import { usePhysicsStore } from '@/store/physicsStore';
import { usePhysicsI18n } from '@/lib/i18n';
import { physicsGuidedExperiments, physicsExperimentsBySlug } from '@/lib/physicsData';
import {
  BookOpen,
  CheckCircle2,
  HelpCircle,
  ShieldAlert,
  Sparkles,
  Award,
  ChevronRight,
  RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function ObservationPanel() {
  const { isBangla } = usePhysicsI18n();
  const activeExperimentSlug = usePhysicsStore((s) => s.activeExperimentSlug);
  const loadExperiment = usePhysicsStore((s) => s.loadExperiment);
  const completedSteps = usePhysicsStore((s) => s.completedSteps);
  const toggleStepComplete = usePhysicsStore((s) => s.toggleStepComplete);
  const quizAnswers = usePhysicsStore((s) => s.quizAnswers);
  const setQuizAnswer = usePhysicsStore((s) => s.setQuizAnswer);
  const quizSubmitted = usePhysicsStore((s) => s.quizSubmitted);
  const submitQuiz = usePhysicsStore((s) => s.submitQuiz);
  const resetQuiz = usePhysicsStore((s) => s.resetQuiz);

  const [activeTab, setActiveTab] = useState<'theory' | 'steps' | 'precautions' | 'quiz' | 'catalog'>('steps');

  const exp = activeExperimentSlug ? physicsExperimentsBySlug.get(activeExperimentSlug) : null;

  // Quiz score computation
  const totalQuestions = exp?.quiz?.length || 0;
  const correctCount = exp?.quiz?.filter((q) => quizAnswers[q.id] === q.correctOptionId).length || 0;
  const scorePercent = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  return (
    <div className="flex h-full flex-col rounded-3xl border border-[var(--line)] bg-[var(--surface)] shadow-card overflow-hidden">
      {/* Top Header */}
      <div className="border-b border-[var(--line)] p-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-wider text-physics-600 dark:text-physics-300">
            {isBangla ? 'গাইডেড ল্যাব নির্দেশিকা' : 'Guided Experiment Guide'}
          </span>
          <button
            type="button"
            onClick={() => setActiveTab('catalog')}
            className="text-[11px] font-bold text-physics-600 hover:underline"
          >
            {isBangla ? 'সব পরীক্ষা' : 'All 30 Practicals'}
          </button>
        </div>

        <h3 className="text-sm font-black text-[var(--ink)] line-clamp-1">
          {exp ? (isBangla ? exp.title_bn : exp.title_en) : (isBangla ? 'কোনো পরীক্ষা লোড করা নেই' : 'Free-Play Sandbox Mode')}
        </h3>

        {/* Tab switcher */}
        {exp && (
          <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveTab('steps')}
              className={cn(
                'flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition whitespace-nowrap',
                activeTab === 'steps' ? 'bg-physics-600 text-white shadow-sm' : 'bg-[var(--surface-soft)] text-[var(--muted)]'
              )}
            >
              <CheckCircle2 size={12} />
              {isBangla ? 'ধাপসমূহ' : 'Steps'} ({completedSteps.length}/{exp.procedureSteps.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('theory')}
              className={cn(
                'flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition whitespace-nowrap',
                activeTab === 'theory' ? 'bg-physics-600 text-white shadow-sm' : 'bg-[var(--surface-soft)] text-[var(--muted)]'
              )}
            >
              <BookOpen size={12} />
              {isBangla ? 'তত্ত্ব' : 'Theory'}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('precautions')}
              className={cn(
                'flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition whitespace-nowrap',
                activeTab === 'precautions' ? 'bg-physics-600 text-white shadow-sm' : 'bg-[var(--surface-soft)] text-[var(--muted)]'
              )}
            >
              <ShieldAlert size={12} />
              {isBangla ? 'সতর্কতা' : 'Precautions'}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('quiz')}
              className={cn(
                'flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition whitespace-nowrap',
                activeTab === 'quiz' ? 'bg-physics-600 text-white shadow-sm' : 'bg-[var(--surface-soft)] text-[var(--muted)]'
              )}
            >
              <HelpCircle size={12} />
              {isBangla ? 'কুইজ' : 'Quiz'}
            </button>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[calc(100vh-22rem)] text-xs">
        {/* --- Catalog view --- */}
        {activeTab === 'catalog' && (
          <div className="space-y-2">
            <h4 className="text-xs font-black text-[var(--ink)]">
              {isBangla ? 'সিলেবাসভিত্তিক ৩০টি পদার্থবিজ্ঞান পরীক্ষা:' : '30 Guided Physics Laboratory Practicals:'}
            </h4>
            <div className="space-y-2 pt-1">
              {physicsGuidedExperiments.map((e) => (
                <button
                  key={e.slug}
                  type="button"
                  onClick={() => {
                    loadExperiment(e.slug);
                    setActiveTab('steps');
                  }}
                  className={cn(
                    'flex w-full items-center justify-between rounded-2xl border p-3 text-left transition',
                    activeExperimentSlug === e.slug
                      ? 'border-physics-500 bg-physics-500/10'
                      : 'border-[var(--line)] bg-[var(--surface-soft)] hover:border-physics-400'
                  )}
                >
                  <div>
                    <h5 className="text-xs font-black text-[var(--ink)]">
                      {isBangla ? e.title_bn : e.title_en}
                    </h5>
                    <p className="text-[10px] font-bold text-[var(--muted)] capitalize">
                      {e.domain} · {e.durationMinutes} min
                    </p>
                  </div>
                  <ChevronRight size={15} className="text-physics-600" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* --- Steps view --- */}
        {exp && activeTab === 'steps' && (
          <div className="space-y-3">
            <div className="rounded-2xl border border-physics-200 bg-physics-50/50 p-3 dark:border-physics-900/60 dark:bg-physics-900/20">
              <span className="text-[10px] font-black uppercase text-physics-700 dark:text-physics-300">
                {isBangla ? 'উদ্দেশ্য (Aim):' : 'Objective (Aim):'}
              </span>
              <p className="mt-1 font-bold text-[var(--ink)] leading-relaxed">
                {isBangla ? exp.aim_bn : exp.aim_en}
              </p>
            </div>

            <div className="space-y-2">
              {exp.procedureSteps.map((step) => {
                const isDone = completedSteps.includes(step.stepNumber);
                return (
                  <div
                    key={step.stepNumber}
                    onClick={() => toggleStepComplete(step.stepNumber)}
                    className={cn(
                      'flex items-start gap-2.5 rounded-2xl border p-3 transition cursor-pointer select-none',
                      isDone
                        ? 'border-emerald-300 bg-emerald-500/10 dark:border-emerald-800'
                        : 'border-[var(--line)] bg-[var(--surface-soft)] hover:border-physics-400'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isDone}
                      onChange={() => {}}
                      className="mt-0.5 h-4 w-4 rounded accent-physics-600"
                    />
                    <div className="space-y-1">
                      <span className="text-[11px] font-black text-[var(--ink)]">
                        {isBangla ? `ধাপ ${step.stepNumber}` : `Step ${step.stepNumber}`}
                      </span>
                      <p className={cn('text-xs font-bold leading-relaxed', isDone ? 'text-emerald-800 dark:text-emerald-200 line-through opacity-75' : 'text-[var(--ink)]')}>
                        {isBangla ? step.instruction_bn : step.instruction_en}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* --- Theory view --- */}
        {exp && activeTab === 'theory' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-soft)] p-3.5 space-y-2">
              <h4 className="text-xs font-black text-[var(--ink)]">
                {isBangla ? 'তত্ত্ব ও ব্যাখ্যা:' : 'Scientific Theory:'}
              </h4>
              <p className="font-bold text-[var(--ink)] leading-relaxed">
                {isBangla ? exp.theory_bn : exp.theory_en}
              </p>
            </div>

            <div className="rounded-2xl border border-physics-300 bg-physics-500/10 p-3.5 font-mono">
              <span className="text-[10px] font-black uppercase text-physics-700 dark:text-physics-300">
                {isBangla ? 'মূল সমীকরণ (Formula):' : 'Governing Equation:'}
              </span>
              <p className="mt-1 text-sm font-black text-physics-900 dark:text-physics-100">
                {exp.formula_latex}
              </p>
              <p className="mt-1 text-[11px] font-bold text-[var(--muted)]">
                {isBangla ? exp.formula_desc_bn : exp.formula_desc_en}
              </p>
            </div>
          </div>
        )}

        {/* --- Precautions view --- */}
        {exp && activeTab === 'precautions' && (
          <div className="space-y-2.5">
            <h4 className="text-xs font-black text-[var(--ink)]">
              {isBangla ? 'সতর্কতা ও ব্যবহারিক নির্দেশিকা:' : 'Laboratory Precautions & Tips:'}
            </h4>
            <ul className="space-y-2">
              {(isBangla ? exp.precautions_bn : exp.precautions_en).map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] p-2.5 font-bold text-[var(--ink)] leading-relaxed">
                  <ShieldAlert size={14} className="mt-0.5 shrink-0 text-amber-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* --- Quiz view --- */}
        {exp && activeTab === 'quiz' && (
          <div className="space-y-4">
            {quizSubmitted && (
              <div className="rounded-2xl border border-physics-300 bg-physics-500/10 p-4 text-center">
                <Award size={28} className="mx-auto mb-1 text-physics-600" />
                <h4 className="text-sm font-black text-[var(--ink)]">
                  {isBangla ? `আপনার স্কোর: ${correctCount}/${totalQuestions} (${scorePercent}%)` : `You scored ${correctCount}/${totalQuestions} (${scorePercent}%)`}
                </h4>
                <button
                  type="button"
                  onClick={resetQuiz}
                  className="mt-2 text-xs font-bold text-physics-600 underline"
                >
                  {isBangla ? 'পুনরায় কুইজ দিন' : 'Retake Quiz'}
                </button>
              </div>
            )}

            {exp.quiz.map((q, idx) => {
              const selectedOpt = quizAnswers[q.id];
              const isCorrect = selectedOpt === q.correctOptionId;

              return (
                <div key={q.id} className="rounded-2xl border border-[var(--line)] bg-[var(--surface-soft)] p-3.5 space-y-2.5">
                  <h5 className="text-xs font-black text-[var(--ink)] leading-relaxed">
                    {idx + 1}. {isBangla ? q.question_bn : q.question_en}
                  </h5>

                  <div className="space-y-1.5">
                    {q.options.map((opt) => {
                      const isOptionSelected = selectedOpt === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          disabled={quizSubmitted}
                          onClick={() => setQuizAnswer(q.id, opt.id)}
                          className={cn(
                            'flex w-full items-center gap-2 rounded-xl border p-2 text-left font-bold transition text-xs',
                            isOptionSelected
                              ? 'border-physics-500 bg-physics-500/20 text-physics-700 dark:text-physics-200'
                              : 'border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--surface-soft)]'
                          )}
                        >
                          <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full border border-[var(--line)] text-[10px] font-black">
                            {opt.id.toUpperCase()}
                          </span>
                          <span>{isBangla ? opt.text_bn : opt.text_en}</span>
                        </button>
                      );
                    })}
                  </div>

                  {quizSubmitted && (
                    <div className={cn('rounded-xl p-2.5 text-[11px] font-bold', isCorrect ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-200' : 'bg-red-500/10 text-red-800 dark:text-red-200')}>
                      <p className="font-black">{isCorrect ? (isBangla ? '✓ সঠিক উত্তর!' : '✓ Correct!') : (isBangla ? `✗ ভুল হয়েছে। সঠিক উত্তর: ${q.correctOptionId.toUpperCase()}` : `✗ Incorrect. Correct: ${q.correctOptionId.toUpperCase()}`)}</p>
                      <p className="mt-1 text-[10px] opacity-90">{isBangla ? q.explanation_bn : q.explanation_en}</p>
                    </div>
                  )}
                </div>
              );
            })}

            {!quizSubmitted && (
              <button
                type="button"
                onClick={submitQuiz}
                className="w-full rounded-xl bg-physics-600 py-2.5 text-xs font-black text-white shadow-sm hover:bg-physics-700"
              >
                {isBangla ? 'উত্তর জমা দিন' : 'Submit Quiz Answers'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
