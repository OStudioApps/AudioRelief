/**
 * Why the same onboarding screens are being shown, which decides where they
 * let out.
 *
 * The steps are one linear chain, and that chain used to end at the account
 * screen no matter how it was entered. That is right on a first run and wrong
 * every other time: someone already signed in, tapping "edit my profile" from
 * home, was walked through all seven steps and then asked to create an
 * account. A check-in was worse — the card promises one question, then
 * marched them through the remaining four screens to the same dead end.
 *
 * A module-level value rather than a route param because the mode has to
 * survive six pushes without every screen having to forward it, and a wrong
 * value here is cosmetic (an exit lands on the wrong screen) rather than
 * destructive.
 */

export type FlowMode =
  /** First run, from the welcome screen. Ends at the account screen. */
  | 'firstRun'
  /** Revisiting the questions from home. Ends back at home. */
  | 'edit'
  /** The periodic impact question only. One screen, then home. */
  | 'checkin';

let mode: FlowMode = 'firstRun';

export function setFlowMode(m: FlowMode) {
  mode = m;
}

export function getFlowMode(): FlowMode {
  return mode;
}
