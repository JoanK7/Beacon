// Question banks for the module quizzes and the skill check.
//
// - Each module has 10 quiz questions; every quiz attempt draws 5 of them, so
//   repeating a quiz is not the same as memorising one fixed set.
// - The skill check has its own 2 questions per module. They never appear in a
//   quiz, so the before/after measure is not inflated by quiz practice, and the
//   skill check review never shows the correct option.
// Ids are stable: quiz attempts store them, so do not reuse an id for a
// different question. Every question is written from the module's own text.
import type { QuestionContent } from './types';

const q = (id: string, prompt: string, options: string[], answerIndex: number, explanation: string): QuestionContent => ({
  id,
  prompt,
  options,
  answerIndex,
  explanation,
});

export const quizBanks: Record<string, QuestionContent[]> = {
  'peers-model': [
    q('peers-q1', 'In the PEERS model, care is best described as…', [
      'Fixing someone’s problems as quickly as possible',
      'Relational accompaniment that widens support as needs increase, without breaking connection',
      'Professional treatment provided by a peer',
    ], 1, 'Care is staying with someone in ways that preserve dignity, share responsibility and widen support when needed.'),
    q('peers-q2', 'Which of these is part of a peer counselor’s role?', [
      'Checking in and helping care widen',
      'Diagnosing what a peer is going through',
      'Managing a crisis alone',
    ], 0, 'You notice, check in, stay present and help care widen. Diagnosis and crisis management belong with professionals.'),
    q('peers-q3', 'What does the "R" in PEERS stand for?', ['Responsibility for outcomes', 'Rules and procedures', 'Referral with care'], 2,
      'Referral with care means widening support while staying connected appropriately.'),
    q('peers-q4', 'Who holds clinical responsibility in the programme?', ['The peer counselor', 'The Wellness Center', 'The student’s friends'], 1,
      'Clinical responsibility remains with the Wellness Center. No peer holds risk alone.'),
    q('peers-q5', 'Which of these could count as success in peer counseling?', [
      'Making the student’s struggles disappear',
      'Being available to the student at any hour',
      'The student felt heard, less alone, and took one small positive step',
    ], 2, 'Success is often small and relational: feeling heard, less alone, and more open to support.'),
    q('peers-q6', 'Where do most students turn first when life gets heavy?', [
      'A professional counsellor',
      'People they already trust, such as peers and faith communities',
      'Online advice forums',
    ], 1, 'Students rarely start with professionals. Most turn first to peers and faith communities they already trust.'),
    q('peers-q7', 'In the usual help-seeking order, where does professional counselling come?', [
      'First',
      'In the middle',
      'Last, after meaning, belonging, family and authority figures',
    ], 2, 'Students usually reach professional counselling last. The programme works with this lived order rather than replacing it.'),
    q('peers-q8', 'What does walking "with, not ahead of" someone mean?', [
      'Staying alongside them and letting them set the pace',
      'Deciding what they should do next',
      'Leaving them to cope on their own',
    ], 0, 'You stay alongside the person, listen and ask what they need, rather than taking over.'),
    q('peers-q9', 'What does the "S" in PEERS stand for?', ['Solving problems', 'Shared responsibility', 'Staying silent'], 1,
      'Shared responsibility: no one carries everything alone.'),
    q('peers-q10', 'Which of these is NOT part of peer counseling?', [
      'Checking in',
      'Helping someone feel less alone',
      'Diagnosing a mental health condition',
    ], 2, 'Peer counseling is not therapy and never involves diagnosing. That belongs with professionals.'),
  ],

  'mental-health-101': [
    q('mh101-q1', 'Before exams, a student is irritable, procrastinating and sleeping badly, but still managing. Where are they on the continuum?',
      ['Healthy', 'Reacting', 'Ill'], 1, 'Irritability, procrastination and poor sleep are common, reversible signs of the Reacting zone.'),
    q('mh101-q2', 'Which type of stress comes from intense, prolonged adversity without support?', ['Toxic stress', 'Positive stress', 'Tolerable stress'], 0,
      'Toxic stress is intense and prolonged, without support. Healthy relationships can make stress more tolerable.'),
    q('mh101-q3', 'Which zones of the continuum usually call for professional care?', ['Healthy and Reacting', 'Only Healthy', 'Injured and Ill'], 2,
      'Injured and Ill involve significant impairment and usually need professional care.'),
    q('mh101-q4', 'Which statement about stress is true?', [
      'Stress is always a sign of illness',
      'Stress is cumulative, and early support helps prevent crisis',
      'Stress should be ignored until it passes',
    ], 1, 'Stress builds up over time. Overload is normal, and early support prevents crisis.'),
    q('mh101-q5', 'Which of these can be a sign of distress?', ['Avoiding friends and responsibilities', 'Enjoying usual activities', 'Sleeping well and feeling rested'], 0,
      'Withdrawing from friends and responsibilities is a common sign someone may be struggling.'),
    q('mh101-q6', 'How is a mental health problem different from a mental disorder?', [
      'They mean exactly the same thing',
      'A problem is a period of diminished capacity; a disorder is a condition that impairs daily functioning',
      'A disorder always passes within a few days',
    ], 1, 'Struggling for a while (a problem) is not the same as having a disorder, a condition that impairs everyday functioning.'),
    q('mh101-q7', 'A student sleeps normally, is socially active and takes things in their stride. Which zone are they in?', ['Healthy', 'Injured', 'Ill'], 0,
      'Normal mood changes, consistent performance, normal sleep and being socially active describe the Healthy zone.'),
    q('mh101-q8', 'Tolerable stress, such as grief, can be softened by…', ['Ignoring it', 'Working harder', 'Healthy relationships'], 2,
      'Tolerable stress lasts longer, but healthy relationships help soften it.'),
    q('mh101-q9', 'Why might a peer’s distress go unnoticed?', [
      'Distress always shows clearly',
      'Many struggles stay hidden behind a smile',
      'Only professionals are able to notice distress',
    ], 1, 'Some struggles are easy to notice, but many stay hidden behind a smile, so gentle check-ins matter.'),
    q('mh101-q10', 'Which of these is a common stressor for ALU students?', [
      'Culture shock and adjusting to a new environment',
      'Having too much free time',
      'Never being away from home',
    ], 0, 'Culture shock, relationships, academic pressure, family and finances are common stressors.'),
  ],

  'psychological-first-aid': [
    q('pfa-q1', 'In PFA, what is the first thing to LOOK for?', [
      'Who caused the situation',
      'Safety: is the person and the environment safe?',
      'Whether they will pass their exams',
    ], 1, 'Safety comes first: the person’s physical safety and the safety of the environment.'),
    q('pfa-q2', 'Which of these is part of active listening?', [
      'Planning your advice while they talk',
      'Finishing their sentences to show you understand',
      'Being fully present, including respecting silence',
    ], 2, 'Active listening means full attention, verbal and non-verbal, and respecting when someone does not want to talk.'),
    q('pfa-q3', 'Which of these is NOT Psychological First Aid?', [
      'Pressuring someone to share the details of what happened',
      'Helping someone feel safe and calm',
      'Connecting someone to campus services',
    ], 0, 'PFA never forces or pressures anyone to talk. It is about being ready to listen if they want to.'),
    q('pfa-q4', 'Which is a good way to help calm someone in distress?', [
      'Tell them firmly to calm down',
      'Keep your voice calm and soft, and encourage slow breathing',
      'Raise your voice so they focus on you',
    ], 1, 'A calm, soft tone and slow breathing help someone settle.'),
    q('pfa-q5', 'In PFA, LINK means…', [
      'Connecting someone to information, campus services and social support',
      'Sharing their story with friends so they can help',
      'Linking them to online advice articles only',
    ], 0, 'LINK connects people with services and their own support networks, with their consent.'),
    q('pfa-q6', 'Psychological First Aid means…', [
      'Professional counselling given by a trained peer',
      'Kind, practical support for someone who is upset, scared or going through a hard time',
      'Medical treatment for injuries',
    ], 1, 'PFA is kind and helpful support (WHO, 2022): listening, ensuring safety and connecting people to help.'),
    q('pfa-q7', 'When you approach someone in distress, what should you do first?', [
      'Introduce yourself and explain how you can help',
      'Ask them to tell you everything that happened',
      'Give them advice straight away',
    ], 0, 'Introduce yourself and explain how you can help, then think about what would help them feel safe.'),
    q('pfa-q8', 'When should you tell someone they are safe?', ['Always, to calm them down', 'Never', 'Only if it is true'], 2,
      'Reassurance must be honest. Only tell someone they are safe if it is true.'),
    q('pfa-q9', 'Do Look, Listen and Link always happen in that order?', [
      'Yes, always in that order',
      'No. In real situations they mix, and can happen at the same time',
    ], 1, 'The three actions do not have to happen in order; in real situations they often overlap.'),
    q('pfa-q10', 'Which of these is non-verbal communication?', ['Your posture and eye contact', 'The words you choose', 'A text message'], 0,
      'Facial expressions, tone of voice, eye contact, gestures and posture all communicate without words.'),
  ],

  'boundaries-confidentiality': [
    q('bound-q1', 'A peer asks you to promise you will never tell anyone what they are about to share. What is the best response?', [
      'Promise, so they feel able to trust you',
      'Explain kindly that you keep things private unless you are worried about their safety',
      'Refuse to listen until they agree you can tell others',
    ], 1, 'Be honest about the limits of confidentiality before they share. Never promise secrecy you may not be able to keep.'),
    q('bound-q2', 'When must you involve others immediately?', [
      'A peer is stressed about a deadline',
      'A peer had an argument with a friend',
      'A peer talks about hurting themselves',
    ], 2, 'Talk of self-harm, feeling unsafe, extreme distress or a dangerous secret means involving the Wellness Center straight away.'),
    q('bound-q3', '"No peer holds risk alone" means…', [
      'Responsibility for risk is shared with the Wellness Center',
      'You should handle risky situations quietly by yourself',
      'Risky situations are not your concern',
    ], 0, 'Clinical and safeguarding responsibility sits with the Wellness Center. You are never expected to carry risk alone.'),
    q('bound-q4', 'Being available to a peer at all hours is…', [
      'A sign of a great peer counselor',
      'Not expected, and it can harm you and the support you give',
      'Required by the programme',
    ], 1, 'Success is not being available all the time. Healthy boundaries keep support sustainable.'),
    q('bound-q5', 'Many students hesitate to seek support because they fear…', ['Judgment or gossip', 'Being too busy', 'Getting useful advice'], 0,
      'Fear of judgment or gossip stops many students opening up, which is why confidentiality matters.'),
    q('bound-q6', 'A peer asks you to keep a dangerous secret. What should you do?', [
      'Keep it, because they trusted you',
      'Never promise secrecy, and involve the Wellness Center',
      'Tell other students so they can keep an eye on them',
    ], 1, 'A dangerous secret is one of the situations where you never promise secrecy and involve the Wellness Center.'),
    q('bound-q7', 'A peer relies only on you and messages you late every night. This may be…', [
      'A healthy friendship',
      'Ordinary peer support',
      'Emotional dependency',
    ], 2, 'Relying on one person alone is emotional dependency. Talk it through and gently help them widen their support.'),
    q('bound-q8', 'A peer you support asks to borrow money. What is the best next step?', [
      'Decide alone, to protect their privacy',
      'Talk it through with your supervisor or the Wellness Center',
      'Ignore the request',
    ], 1, 'Financial vulnerability is a common dilemma. You do not have to decide alone; talk it through with your supervisor.'),
    q('bound-q9', 'Respecting faith in peer support means…', [
      'Respecting what is meaningful to them, without imposing your own beliefs',
      'Encouraging them to adopt your beliefs',
      'Avoiding any mention of faith',
    ], 0, 'Be sensitive to each person’s faith and lived experience, without imposing your own beliefs.'),
    q('bound-q10', 'Healthy boundaries keep support…', ['Strict and distant', 'Optional', 'Safe and sustainable, for the peer and for you'], 2,
      'Boundaries protect both of you, so support can continue safely.'),
  ],

  'referral-with-care': [
    q('referral-q1', 'Which situation suggests that care needs to widen?', [
      'A peer had one bad day',
      'A peer’s distress persists and their functioning is declining',
      'A peer wants to vent about a group project',
    ], 1, 'Persistent distress, declining functioning, uncertain safety, or feeling out of your depth all mean care should widen.'),
    q('referral-q2', 'A peer talks about suicide. What are the right steps?', [
      'Stay calm, do not promise secrecy, contact the Wellness Center immediately, and stay connected',
      'Keep it between you so they keep trusting you',
      'Wait a few days to see if the feeling passes',
    ], 0, 'These are the four steps from the training. Contact emergency services first if someone is in immediate danger.'),
    q('referral-q3', 'Referral means…', [
      'Handing someone over and stepping away',
      'Telling them to find help themselves',
      'Adding support while staying connected appropriately',
    ], 2, 'Referral adds support; it does not remove relationship.'),
    q('referral-q4', 'Who holds safeguarding responsibility?', ['The Wellness Center', 'The peer counselor', 'The student’s classmates'], 0,
      'The Wellness Center holds safeguarding and safety responsibility and supports peer supporters.'),
    q('referral-q5', 'You feel out of your depth with a peer’s situation. This means…', [
      'You should try harder on your own',
      'Care needs to widen',
      'You have failed as a peer counselor',
    ], 1, 'Feeling out of your depth is one of the signs that care needs to widen. It is not a failure.'),
    q('referral-q6', 'Which of these is a step in referring someone with care?', [
      'Offer to walk with them to the Wellness Center',
      'Give them a phone number and walk away',
      'Refer them without explaining why',
    ], 0, 'Explain why more support could help, stay connected, offer to walk with them and check in afterwards.'),
    q('referral-q7', 'If someone is in immediate danger, what should you do first?', [
      'Wait to see if it passes',
      'Message their friends',
      'Contact emergency services',
    ], 2, 'Immediate danger means contacting emergency services first.'),
    q('referral-q8', 'After a referral, it can help to…', [
      'Avoid the peer so the professionals can take over',
      'Check in afterwards, if they are comfortable with that',
      'Ask the counsellor what the peer told them',
    ], 1, 'Referral is relational widening: you can check in afterwards, if they are comfortable with that.'),
    q('referral-q9', 'Which sign means you should refer to trained professionals?', [
      'A peer seems disoriented or shows signs of aggression',
      'A peer is nervous before a presentation',
      'A peer misses home now and then',
    ], 0, 'Disorientation, aggression or violence, talk of suicide or self-harm, and withdrawing for weeks all call for professionals.'),
    q('referral-q10', 'Which is a kind way to explain a referral?', [
      '"I can’t deal with this anymore."',
      '"You need a professional because something is wrong with you."',
      '"I want to help, but we need more support."',
    ], 2, 'Explaining why more support could help, kindly and honestly, keeps the relationship intact.'),
  ],

  'caring-for-yourself': [
    q('selfcare-q1', 'Which of these is a warning sign that you are carrying too much?', ['Feeling guilty when you rest', 'Enjoying time with friends', 'Sleeping well'], 0,
      'Guilt when resting, constant worry about someone, and lost sleep are signs you need support too.'),
    q('selfcare-q2', 'When you notice warning signs in yourself, you should…', [
      'Push through, because others need you',
      'Step back and seek support for yourself',
      'Stop replying to everyone without explanation',
    ], 1, 'Warning signs mean you need support too and should not continue alone. Step back with care.'),
    q('selfcare-q3', '"Sustainability is institutional, not individual" means…', [
      'You personally must keep everyone going',
      'Peer support only lasts if one person leads it',
      'The programme and Wellness Center, not you alone, keep support going',
    ], 2, 'Support is shared. The institution, not any single peer, carries the responsibility.'),
    q('selfcare-q4', 'Which is a healthy thing to say when you need to step back?', [
      '"I’ll always be here, any time you need."',
      '"Let’s involve someone else."',
      '"Don’t message me again."',
    ], 1, 'Stepping back kindly, and widening support, protects both of you.'),
    q('selfcare-q5', 'If helping others starts to feel like a burden, it means…', [
      'You are weak',
      'You are human, and you may need support too',
      'You should quit straight away',
    ], 1, 'It can happen to anyone. It does not mean you are weak; it means you are human.'),
    q('selfcare-q6', 'Which of these helps protect your own wellbeing?', [
      'Resting, taking breaks and talking to trusted people',
      'Skipping sleep so you are always available',
      'Keeping everything to yourself',
    ], 0, 'Rest, breaks, talking to trusted people, reflection and relaxing activities all protect you.'),
    q('selfcare-q7', 'Supporting others should not…', [
      'Ever feel meaningful',
      'Involve listening',
      'Destroy your peace, harm your studies, or exhaust you',
    ], 2, 'Peer support should never cost you your peace, your studies or your health.'),
    q('selfcare-q8', 'After a heavy conversation, which step can help?', [
      'A Reflect check-in, and talking to the Wellness Center if you are struggling',
      'Pretending it did not affect you',
      'Messaging the peer every hour to check on them',
    ], 0, 'A check-in helps you notice how you feel, and the Wellness Center supports peer supporters too.'),
    q('selfcare-q9', 'Your studies are suffering because of the support you give. This is…', [
      'A sign of commitment',
      'A warning sign that you are carrying too much',
      'Expected of every peer counselor',
    ], 1, 'Studies being affected is a warning sign: step back and get support.'),
    q('selfcare-q10', 'Do you have permission to pause or step back?', [
      'No, peers must always be available',
      'Only during exams',
      'Yes. Protecting yourself is part of peer support',
    ], 2, 'You have permission to pause or step back. Protecting yourself is part of the role.'),
  ],
};

export const skillCheckBanks: Record<string, QuestionContent[]> = {
  'peers-model': [
    q('peers-s1', 'A peer asks you to tell them what their diagnosis is. As a peer counselor, you should…', [
      'Give your best guess based on what they describe',
      'Explain that diagnosing is not your role, listen, and help them reach professional care',
      'Search online together and pick the closest match',
    ], 1, 'Peer counseling is not diagnosing or therapy. You listen and help care widen to professionals.'),
    q('peers-s2', 'Why does peer support matter at a university like ALU?', [
      'Students often turn to trusted peers first, and belonging is protective',
      'Peers can replace the Wellness Center',
      'It removes the need for professional care',
    ], 0, 'Most students turn to people they trust first. Peer support strengthens this, with professional oversight.'),
  ],
  'mental-health-101': [
    q('mh101-s1', 'A friend has panic attacks, constant fatigue and great difficulty thinking clearly. Where on the continuum might they be?', [
      'Reacting',
      'Healthy',
      'Ill',
    ], 2, 'High anxiety or panic attacks, constant fatigue and significant difficulty with thinking describe the Ill zone.'),
    q('mh101-s2', 'Leaning on caffeine or alcohol to cope can be a sign of…', ['Stress', 'Good self-care', 'Positive stress that resolves quickly'], 0,
      'Using caffeine or alcohol to cope is one of the common signs of stress among students.'),
  ],
  'psychological-first-aid': [
    q('pfa-s1', 'Someone is crying alone in a corridor after an exam. Using PFA, what comes first?', [
      'Ask about their grades',
      'Check they are safe and notice what they need',
      'Tell their friends what you saw',
    ], 1, 'LOOK first: safety, basic needs and signs of distress.'),
    q('pfa-s2', 'A peer does not want to talk about what happened. What should you do?', [
      'Respect their silence and stay available',
      'Keep asking until they open up',
      'Leave straight away',
    ], 0, 'Active listening includes respecting silence. PFA never pressures anyone to talk.'),
  ],
  'boundaries-confidentiality': [
    q('bound-s1', 'You need to involve the Wellness Center because a peer may be at risk. What else should you do?', [
      'Tell the peer first, where possible',
      'Warn other students about them',
      'Do it secretly so they never find out',
    ], 0, 'Being honest keeps trust: "I would involve the Wellness Center, and I would tell you first."'),
    q('bound-s2', 'Which of these shows a healthy boundary?', [
      'Taking responsibility for another person’s healing',
      'Pushing someone until they agree to get help',
      'Knowing you are not expected to carry someone alone',
    ], 2, 'Healthy boundaries mean sharing responsibility; no peer holds risk alone.'),
  ],
  'referral-with-care': [
    q('referral-s1', 'A peer says they feel unsafe at home and asks you not to tell anyone. What should you do?', [
      'Promise to keep it a secret',
      'Stay calm, do not promise secrecy, and contact the Wellness Center',
      'Tell them to sort it out with their family',
    ], 1, 'Feeling unsafe is a risk. Stay calm, do not promise secrecy, contact the Wellness Center and stay connected.'),
    q('referral-s2', 'Beacon’s Directory helps you…', [
      'Find the right campus or local service to link someone to',
      'Diagnose what a peer is going through',
      'Share a peer’s story with other students',
    ], 0, 'The Directory lists services you can link people to, and you can log a referral from it.'),
  ],
  'caring-for-yourself': [
    q('selfcare-s1', 'You feel pressure to always be available to the peers you support. This is…', [
      'A warning sign that you need support too',
      'A sign you are doing the role well',
      'Part of the programme rules',
    ], 0, 'Feeling you must always be available is a warning sign. Step back and get support.'),
    q('selfcare-s2', 'In our communities, how is support usually carried?', [
      'By one strong person',
      'Shared among family, friends, faith and services',
      'Only by professionals',
    ], 1, 'Support is shared: problems are not carried by one person.'),
  ],
};
