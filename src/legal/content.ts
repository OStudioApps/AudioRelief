/**
 * Terms of Service and Privacy Policy for AudioRelief.
 *
 * IMPORTANT — read before shipping: this is placeholder legal content, not
 * legal advice. It is written to be honest about what the app currently does
 * (an in-memory UI shell, no backend yet, no payments yet) and to flag the
 * clauses a tinnitus-adjacent, health-touching app specifically needs — but
 * every [BRACKETED] value is a fact only the business can supply, and the
 * whole document needs review by a qualified lawyer, in your operating
 * jurisdiction, before real users see it. Treat this as a first draft that
 * saves your lawyer a blank page, not as something to publish as-is.
 *
 * Two things worth flagging hard once real data collection exists:
 *  - A self-reported tinnitus profile is health-adjacent data. In the EU/UK
 *    that is "special category" personal data under GDPR and needs explicit
 *    consent and a documented legal basis, not just a general privacy notice.
 *  - "Not a medical device" and "not a substitute for professional care" need
 *    to be true in how the product is marketed as well as in this text —
 *    app-store health-claim rules look at both.
 */

export type LegalSection = { heading: string; body: string };
export type LegalDoc = { title: string; updated: string; intro: string; sections: LegalSection[] };

const UPDATED = '[EFFECTIVE DATE — e.g. 1 January 2027]';

export const TERMS_OF_SERVICE: LegalDoc = {
  title: 'Terms of Service',
  updated: UPDATED,
  intro:
    'These terms cover your use of AudioRelief, an app that plays masking sound and sleep sounds. Please read them before creating an account — using AudioRelief means you agree to them.',
  sections: [
    {
      heading: '1. What AudioRelief is',
      body:
        'AudioRelief plays coloured noise, ambient sound and sound mixes to help with sleep and with the day-to-day experience of tinnitus. AudioRelief is a sound tool, not a medical device, and it does not diagnose, treat, or cure tinnitus, hearing loss, or any other condition. If your tinnitus is sudden, in one ear only, pulses in time with your heartbeat, or comes with hearing loss or dizziness, stop using the app and see a doctor or audiologist — those are signs worth checking promptly, and no app is a substitute for that.',
    },
    {
      heading: '2. Who can use AudioRelief',
      body:
        'You must be at least [MINIMUM AGE — e.g. 16] years old to create an account, or meet the minimum age for consenting to data processing in your country, whichever is higher. If you are using AudioRelief on behalf of a child, a parent or guardian must accept these terms.',
    },
    {
      heading: '3. Your account',
      body:
        'You are responsible for keeping your login details secure and for anything that happens under your account. Tell us if you think someone else has access to it. We may suspend or close an account that is used to break these terms, abuse the service, or attempt to access other users’ data.',
    },
    {
      heading: '4. Hearing safety',
      body:
        'AudioRelief limits how loud its sounds can play and warns you above a threshold we consider unsafe for long, unattended listening — masking sound played too loud, for too long, can itself contribute to hearing damage, which can make tinnitus worse rather than better. That limit is a safeguard, not a guarantee: you are responsible for keeping your device and headphone volume at a level that is comfortable and safe for you, and for taking the warning seriously when you see it.',
    },
    {
      heading: '5. Subscriptions and payment',
      body:
        '[AudioRelief is currently free to use. / Some features require a paid subscription, billed [MONTHLY/ANNUALLY] through the App Store or Google Play, auto-renewing unless cancelled at least 24 hours before the renewal date. Prices, trial terms, and refund handling are set out at the point of purchase and are governed by the store you purchased through.] — replace this section with your actual pricing model before launch.',
    },
    {
      heading: '6. Content and accounts you connect',
      body:
        'If you sign in with Apple or Google, you are also bound by their terms for that sign-in method. We only receive the account information those services choose to share with us for the purpose of creating your AudioRelief account.',
    },
    {
      heading: '7. Acceptable use',
      body:
        'Use AudioRelief only as intended: do not attempt to reverse-engineer, resell, or redistribute the app or its sounds, interfere with its operation, or use it in a way that could harm other users or AudioRelief itself.',
    },
    {
      heading: '8. Our content',
      body:
        'The app, its design, its sounds, and its trademarks belong to us or our licensors. Using the app does not give you any ownership of it — only a personal, non-transferable right to use it under these terms.',
    },
    {
      heading: '9. Disclaimers',
      body:
        'AudioRelief is provided "as is." We do not promise it will be uninterrupted, error-free, or effective for your particular circumstances — sound-based approaches to tinnitus and sleep do not work identically for everyone. To the extent the law allows, we are not liable for indirect or consequential loss arising from your use of the app.',
    },
    {
      heading: '10. Changes to these terms',
      body:
        'We may update these terms as the app changes. If a change is material, we will let you know before it takes effect. Continuing to use AudioRelief after that means you accept the updated terms.',
    },
    {
      heading: '11. Ending your use',
      body:
        'You can stop using AudioRelief and delete your account at any time from within the app. We may suspend or end your access if you seriously or repeatedly break these terms.',
    },
    {
      heading: '12. Governing law',
      body:
        'These terms are governed by the laws of [JURISDICTION — e.g. England and Wales], without regard to conflict-of-law principles, unless local consumer-protection law in your country of residence requires otherwise.',
    },
    {
      heading: '13. Contact',
      body:
        'Questions about these terms can be sent to [SUPPORT EMAIL ADDRESS].',
    },
  ],
};

export const PRIVACY_POLICY: LegalDoc = {
  title: 'Privacy Policy',
  updated: UPDATED,
  intro:
    'This explains what AudioRelief collects, why, and what choices you have. We have written it to match what the app genuinely does today, and we will update it as features change — most notably before anything described as "planned" below actually starts collecting data.',
  sections: [
    {
      heading: '1. Who this policy covers',
      body:
        'This policy applies to anyone who uses the AudioRelief app. AudioRelief is operated by [COMPANY / DEVELOPER NAME], [COMPANY ADDRESS]. Where this policy refers to "we," "us," or "AudioRelief," it means that entity.',
    },
    {
      heading: '2. What we collect',
      body:
        'Account information: the email address and password you provide, or the limited profile information Apple or Google shares with us if you sign in that way. Sound and mix preferences: the sounds, mixes, volumes and timers you set, so the app can restore them next time you open it. Tinnitus profile [PLANNED]: if you complete a pitch-matching or symptom check-in, the frequency, character and impact information you enter. This is health-related information and we treat it with extra care — see section 4. Usage information: general app usage such as which screens you open, so we can find and fix problems; we do not track this to build an advertising profile of you. Device information: basic technical details (device type, OS version, app version) needed to keep the app working correctly.',
    },
    {
      heading: '3. What we do not collect',
      body:
        'AudioRelief does not use your microphone and does not listen to your environment. The sounds it plays go out through your speaker or headphones; nothing about your surroundings is recorded or sent to us.',
    },
    {
      heading: '4. Health-related information',
      body:
        'A tinnitus profile — the sound, pitch and severity you describe — is more sensitive than ordinary app data. We only collect it with your explicit, separate consent at the point you provide it, we do not use it for advertising, and we do not sell it. Under data protection law in the EU/UK this is treated as a "special category" of personal data, and our legal basis for processing it is your explicit consent, which you can withdraw at any time by deleting that data from your profile or deleting your account.',
    },
    {
      heading: '5. Why we process your information',
      body:
        'To provide the app and remember your settings (performing our contract with you); to keep the service secure and working (our legitimate interest in running the app responsibly); and, for your tinnitus profile specifically, because you have explicitly consented to it. We do not process your personal information for automated decision-making that has a legal or similarly significant effect on you.',
    },
    {
      heading: '6. Where your information is stored',
      body:
        'Today, your mixes, timers and settings are stored only on your device — we do not currently operate a server that stores them. [Once account sync ships: your information will be stored on servers located in [REGION], protected in transit and at rest with industry-standard encryption.] This section should be corrected the moment that changes — it should always describe what actually happens, not what is planned.',
    },
    {
      heading: '7. Who we share it with',
      body:
        'We do not sell your personal information. We share it only with: service providers who help us run the app under contracts that limit them to our instructions (for example, cloud hosting or crash reporting, once in use — [LIST PROVIDERS]); Apple or Google, only as needed to authenticate your sign-in; and anyone we are legally required to share it with, such as in response to a valid legal request.',
    },
    {
      heading: '8. How long we keep it',
      body:
        'We keep your account information for as long as your account is active. If you delete your account, we delete your personal information within [RETENTION PERIOD — e.g. 30 days], except where we are required to keep certain records for longer by law.',
    },
    {
      heading: '9. Your rights',
      body:
        'Depending on where you live, you may have the right to access the personal information we hold about you, correct it, delete it, export it, restrict or object to certain processing, and withdraw consent at any time (which does not affect anything processed before that). To exercise any of these, contact [PRIVACY CONTACT EMAIL]. If you are in the EU or UK, you also have the right to complain to your local data protection authority.',
    },
    {
      heading: '10. Children',
      body:
        'AudioRelief is not directed at children under [MINIMUM AGE — e.g. 16], and we do not knowingly collect personal information from them. If you believe a child has provided us with personal information, contact us and we will delete it.',
    },
    {
      heading: '11. Security',
      body:
        'We use reasonable technical and organisational measures to protect your information. No method of storage or transmission is perfectly secure, and we cannot guarantee absolute security.',
    },
    {
      heading: '12. International transfers',
      body:
        '[If your information is transferred outside your country of residence, we rely on [TRANSFER MECHANISM — e.g. Standard Contractual Clauses] to protect it. This section only applies once cross-border processing actually exists.]',
    },
    {
      heading: '13. Changes to this policy',
      body:
        'We may update this policy as AudioRelief changes. If a change is material — especially anything that changes how we handle your tinnitus profile — we will tell you before it takes effect, not just post a new version.',
    },
    {
      heading: '14. Contact us',
      body:
        'For any question about this policy or your information, contact [PRIVACY CONTACT EMAIL]. [If a Data Protection Officer is appointed: you can also reach our DPO at [DPO CONTACT].]',
    },
  ],
};
