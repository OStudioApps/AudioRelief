/**
 * The tinnitus profile: what onboarding asks, and what the app does with it.
 *
 * Everything here is deliberately mechanical. The app describes what sound
 * does — masking, notching, habituation — and never promises an outcome.
 * See RESEARCH below for the citation policy.
 */

export type CharacterId = 'ringing' | 'buzzing' | 'hissing' | 'roaring' | 'pulsing';

export type Character = {
  id: CharacterId;
  label: string;
  hint: string;
  /** Pulsatile tinnitus is the one quality that warrants medical review. */
  seeDoctor?: boolean;
};

export const CHARACTERS: Character[] = [
  { id: 'ringing', label: 'Ringing', hint: 'A clear, steady high tone' },
  { id: 'buzzing', label: 'Buzzing', hint: 'A low electrical hum' },
  { id: 'hissing', label: 'Hissing', hint: 'Like escaping steam or static' },
  { id: 'roaring', label: 'Roaring', hint: 'Deep and wide, like distant surf' },
  {
    id: 'pulsing',
    label: 'Pulsing',
    hint: 'In time with your heartbeat',
    seeDoctor: true,
  },
];

/**
 * Pitch-matching candidates. Nine steps from 500Hz to 12kHz — enough to land
 * within a useful range without turning the screen into a hearing test.
 *
 * Every tone is generated at the same amplitude. Worth knowing: that is not the
 * same as equal *perceived* loudness, and clinical pitch matching loudness-
 * matches each tone. Doing that properly depends on the person's own hearing
 * curve, which is exactly the thing that varies here — so this asks which is
 * closest in pitch, never which is loudest.
 */
export type ToneId = '500' | '1k' | '2k' | '3k' | '4k' | '6k' | '8k' | '10k' | '12k';

export const TONES: Array<{ id: ToneId; label: string; hz: number }> = [
  { id: '500', label: '500 Hz', hz: 500 },
  { id: '1k', label: '1 kHz', hz: 1000 },
  { id: '2k', label: '2 kHz', hz: 2000 },
  { id: '3k', label: '3 kHz', hz: 3000 },
  { id: '4k', label: '4 kHz', hz: 4000 },
  { id: '6k', label: '6 kHz', hz: 6000 },
  { id: '8k', label: '8 kHz', hz: 8000 },
  { id: '10k', label: '10 kHz', hz: 10000 },
  { id: '12k', label: '12 kHz', hz: 12000 },
];

export const WORST_WHEN = [
  { id: 'night', label: 'At night, when it goes quiet' },
  { id: 'stress', label: 'When I am stressed or tired' },
  { id: 'quiet', label: 'In any quiet room' },
  { id: 'always', label: 'About the same, all the time' },
];

export const DURATIONS = [
  { id: 'lt6m', label: 'Less than 6 months' },
  { id: '6m1y', label: '6 months to a year' },
  { id: '1to5', label: '1 to 5 years' },
  { id: 'gt5', label: 'More than 5 years' },
];

/**
 * Citations.
 *
 * The rule for this app: name real work, describe it accurately, and never
 * overstate what it shows. No outcome promises, no invented institutions, and
 * no implication that this app is any of these therapies — only that they are
 * why it is built the way it is.
 *
 * Shown as text only. Nothing here links out, by product decision.
 *
 * Each one verified against the source, 30 August 2026:
 *
 * 1. Okamoto H, Stracke H, Stoll W, Pantev C. "Listening to tailor-made
 *    notched music reduces tinnitus loudness and tinnitus-related auditory
 *    cortex activity." PNAS 2010;107(3):1207–1210. Pantev's lab is at the
 *    Institute for Biomagnetism and Biosignalanalysis, University of Münster.
 *    Small target group (n=8) over 12 months — hence "was tested as", not
 *    "reduces".
 * 2. Fuller T, Cima R, Langguth B, Mazurek B, Vlaeyen JWS, Hoare DJ.
 *    "Cognitive behavioural therapy for tinnitus." Cochrane Database Syst Rev
 *    2020, Issue 1, CD012614. Conclusion is that CBT may reduce the impact of
 *    tinnitus on quality of life — the claim below is worded to match that,
 *    not to claim it removes the sound.
 * 3. Jarach CM, Lugo A, Scala M, et al. "Global Prevalence and Incidence of
 *    Tinnitus: A Systematic Review and Meta-analysis." JAMA Neurology
 *    2022;79(9):888–900. 14.4% of adults; the authors' own phrasing is
 *    "1 in 7 adults".
 * 4. Jastreboff PJ. "Phantom auditory perception (tinnitus): mechanisms of
 *    generation and perception." Neuroscience Research 1990;8(4):221–254.
 * 5. Tunkel DE, et al. "Clinical Practice Guideline: Tinnitus."
 *    Otolaryngology–Head and Neck Surgery, AAO-HNSF, October 2014. Recommends
 *    CBT and sound therapy for persistent bothersome tinnitus; recommends
 *    against ginkgo biloba, melatonin, zinc and other dietary supplements.
 */
export type Citation = { claim: string; source: string };

export const RESEARCH: Citation[] = [
  {
    claim: 'Filtering a notch into music around a person’s own tinnitus pitch was tested as a way to reduce its loudness.',
    source: 'Okamoto, Stracke, Stoll and Pantev, PNAS, 2010 — University of Münster',
  },
  {
    claim: 'Cognitive behavioural therapy has the best evidence for reducing the impact tinnitus has on daily life.',
    source: 'Cochrane Database of Systematic Reviews, 2020',
  },
  {
    claim: 'Roughly one in seven adults experiences tinnitus.',
    source: 'Jarach and colleagues, JAMA Neurology, 2022',
  },
  {
    claim: 'The habituation model describes tinnitus as a signal the brain has learned to treat as important.',
    source: 'Jastreboff, Neuroscience Research, 1990',
  },
  {
    claim: 'Clinical guidance recommends sound therapy and CBT as options, and advises against unproven supplements.',
    source: 'American Academy of Otolaryngology–Head and Neck Surgery guideline, 2014',
  },
];

/** Red flags worth seeing a clinician about, shown at the end of onboarding. */
export const RED_FLAGS = [
  'It started suddenly, or after an injury',
  'You hear it in one ear only',
  'It pulses in time with your heartbeat',
  'It comes with hearing loss, dizziness or ear pain',
];
