// Training modules adapted from the Solid Minds Counselling Clinic "PEERS
// Circles of Care" peer counselor training delivered at ALU (May 2026):
//   - Peer Counselor Training, Day 1 (Foundations: care, context & role)
//   - Day 2: Mental Health 101 & the Foundations of Responsible Peer Counseling
//   - Peer Support Programs for Student Wellbeing
//   - Group discussion briefs (safe spaces, caring for the carer, the club)
// Wording is adapted for short mobile lessons and is pending Solid Minds' final
// review (content_verified = false until they approve it in the Admin screens).
import type { ModuleContent } from './types';

// Section bodies use the lesson markup (bold terms, callouts, flip cards,
// quick checks); see docs/design/style-guide.md. Blocks are separated by a
// blank line; lines within a block (a list, cards, a check) by a line break.
const blocks = (...b: string[]) => b.join('\n\n');
const lines = (...l: string[]) => l.join('\n');

export const SOURCE_NOTE =
  'Adapted from the Solid Minds Counselling Clinic PEERS Circles of Care training (ALU, May 2026). Pending final review by Solid Minds.';

export const modules: ModuleContent[] = [
  {
    slug: 'peers-model',
    title: 'Peer Support & the PEERS Model',
    topic: 'Role clarity',
    summary: 'Why peer support exists at ALU, what care means, and what your role is (and is not).',
    estimatedMinutes: 12,
    version: 2,
    sections: [
      {
        heading: 'Why peer support at ALU?',
        body: blocks(
          'Students rarely start with professionals. When life gets heavy, most students turn first to **people they already trust**.',
          lines(
            '- Students first seek support from **peers and faith communities**',
            '- Wellness staff are limited in number',
            '- **Belonging is protective**',
            '- Early relational support **reduces crisis escalation**',
          ),
          '> Example: In a Solid Minds survey of Rwandan university students, **81%** said they feel comfortable reaching out to a friend when they are emotionally struggling, far more than any other source of support.',
          '> Remember: The PEERS programme strengthens what already exists in student life, safely and with **professional oversight**.',
        ),
      },
      {
        heading: 'How students seek help',
        body: blocks(
          'Students tend to look for support in this order:',
          lines(
            '1. **Meaning**: faith, spiritual life, self-care',
            '2. **Belonging**: best friends and trusted peers',
            '3. **Unconditional care**: a mother or mother figure',
            '4. **Shared life**: siblings',
            '5. **Authority figures**: fathers, mentors',
            '6. **Professional counselling**',
          ),
          'The programme aligns with this lived order rather than replacing it.',
          '> Remember: As a peer, you are often the **first door** someone knocks on.',
        ),
      },
      {
        heading: 'What care means',
        body: blocks(
          '**Care** is relational accompaniment: staying with another person in ways that **preserve dignity**, **distribute responsibility**, and **widen support** as needs increase, without breaking connection.',
          '> Example: "I am because we are." Peer support comes not from techniques but from **presence, relationship and community**.',
          lines(
            '?? A friend tells you they are struggling. What might walking "with, not ahead of" them look like?',
            '= Staying alongside them: listening, asking what they need and letting them set the pace, rather than taking over or rushing to fix things.',
          ),
          '> Remember: You walk **with**, not ahead of, someone.',
        ),
      },
      {
        heading: 'The PEERS model',
        body: blocks(
          'Five ideas guide everything a peer counselor does. Tap each letter to see what it stands for.',
          lines(
            '+ P | **Presence**: being fully with the person',
            '+ E | **Empathy**: trying to understand how they feel',
            '+ E | **Early support**: noticing and checking in before things escalate',
            '+ R | **Referral with care**: widening support without letting go',
            '+ S | **Shared responsibility**: no one carries everything alone',
          ),
          lines(
            '? A peer seems a little low this week, though nothing serious has happened. Checking in now is an example of…',
            '[ ] Referral with care',
            '[x] Early support',
            '[ ] Shared responsibility',
            '= Early support means noticing and checking in **before** things escalate.',
          ),
        ),
      },
      {
        heading: 'What peer counseling is, and is not',
        body: blocks(
          '**Peer counseling IS:**',
          lines(
            '- Listening',
            '- Checking in',
            '- Emotional support and encouragement',
            '- Helping someone feel less alone',
            '- A liaison to the Wellness Center',
            '- Outreach support',
          ),
          '**Peer counseling is NOT:**',
          lines('- Therapy', '- Fixing people', '- Diagnosing', '- Carrying someone alone', '- Replacing professionals'),
          'Tap each card to flip it:',
          lines(
            '+ What you do | Notice, check in, stay present, normalise struggle and help care widen',
            '+ What you do not do | Diagnose, treat, or manage a crisis alone',
          ),
          '> Remember: Peer counseling is **not therapy**, and it never means carrying someone alone.',
        ),
      },
      {
        heading: 'Principles and what success looks like',
        body: blocks(
          'These principles govern the whole programme:',
          lines(
            '- **Care widens** as needs increase',
            '- No circle replaces another',
            '- Referral **adds** support; it does not remove relationship',
            '- Peer support is **relational, not clinical**',
            '- **No peer holds risk alone**',
            '- Clinical responsibility remains with the **Wellness Center**',
            '- Sustainability is institutional, not individual',
          ),
          '> Watch out: Success is **not** fixing someone, having all the answers or being available all the time.',
          'Sometimes success looks like a student who:',
          lines(
            '- felt safe enough to open up',
            '- felt heard and less alone',
            '- took one small positive step',
            '- accepted more support when they needed it',
          ),
          '> Remember: Success is often small: a student who feels **heard, less alone**, and a little more open to support.',
        ),
      },
    ],
    quiz: [
      {
        prompt: 'In the PEERS model, care is best described as…',
        options: [
          'Fixing someone’s problems as quickly as possible',
          'Relational accompaniment that widens support as needs increase, without breaking connection',
          'Professional treatment provided by a peer',
        ],
        answerIndex: 1,
        explanation: 'Care is staying with someone in ways that preserve dignity, share responsibility and widen support when needed.',
      },
      {
        prompt: 'Which of these is part of a peer counselor’s role?',
        options: ['Checking in and helping care widen', 'Diagnosing what a peer is going through', 'Managing a crisis alone'],
        answerIndex: 0,
        explanation: 'You notice, check in, stay present and help care widen. Diagnosis and crisis management belong with professionals.',
      },
      {
        prompt: 'What does the "R" in PEERS stand for?',
        options: ['Responsibility for outcomes', 'Rules and procedures', 'Referral with care'],
        answerIndex: 2,
        explanation: 'Referral with care means widening support while staying connected appropriately.',
      },
      {
        prompt: 'Who holds clinical responsibility in the programme?',
        options: ['The peer counselor', 'The Wellness Center', 'The student’s friends'],
        answerIndex: 1,
        explanation: 'Clinical responsibility remains with the Wellness Center. No peer holds risk alone.',
      },
      {
        prompt: 'Which of these could count as success in peer counseling?',
        options: [
          'Making the student’s struggles disappear',
          'Being available to the student at any hour',
          'The student felt heard, less alone, and took one small positive step',
        ],
        answerIndex: 2,
        explanation: 'Success is often small and relational: feeling heard, less alone, and more open to support.',
      },
    ],
  },
  {
    slug: 'mental-health-101',
    title: 'Mental Health 101',
    topic: 'Mental health literacy',
    summary: 'The mental health continuum, and how to tell stress, distress and crisis apart.',
    estimatedMinutes: 12,
    version: 2,
    sections: [
      {
        heading: 'What we mean by mental health',
        body: blocks(
          'Three terms are easy to mix up. Tap each card to see what it means.',
          lines(
            '+ Mental health | The capacity to think, feel and act in ways that enhance our ability to **enjoy life** (being happy, productive, social) and to **deal with challenges**',
            '+ Mental health problem | **Diminished capacity** (cognitive, emotional, behavioural) that interferes with enjoying life and interacting with our society and environment',
            '+ Mental disorder | A **condition** that affects a person’s thinking, feeling, mood and behaviour in ways that impair their ability to socialise with others and function each day',
          ),
          '> Remember: Struggling for a while (a mental health **problem**) is not the same as having a mental **disorder**.',
        ),
      },
      {
        heading: 'We all move along a continuum',
        body: blocks(
          'Mental health is not simply "well" or "ill". We all move along a **continuum**:',
          lines(
            '1. **Healthy**: normal mood changes, taking things in stride, consistent performance, normal sleep, socially active',
            '2. **Reacting**: irritable or nervous, sadness, worrying, procrastination, trouble sleeping, lower energy',
            '3. **Injured**: anger, anxiety, lingering sadness, hopelessness, preoccupation, falling performance',
            '4. **Ill**: significant difficulty with emotions and thinking, high anxiety or panic attacks, depressed mood, constant fatigue',
          ),
          '> Remember: **Healthy** and **Reacting** are usually helped by self-care and social support. **Injured** and **Ill** usually need professional care.',
          lines(
            '? A friend has had lingering sadness and hopelessness for weeks, and their grades are falling. Where might they be on the continuum?',
            '[ ] Healthy',
            '[ ] Reacting',
            '[x] Injured',
            '= Lingering sadness, hopelessness and falling performance are signs of the **Injured** zone, where professional care usually helps.',
          ),
        ),
      },
      {
        heading: 'Stress, distress and crisis',
        body: blocks(
          'Common signs of **stress** among students:',
          lines(
            '- Constant exhaustion',
            '- Loss of motivation',
            '- Difficulty concentrating',
            '- Sleep problems',
            '- Headaches or tension',
            '- Withdrawal',
            '- Leaning on caffeine or alcohol to cope',
          ),
          'Not all stress is the same. Tap each type:',
          lines(
            '+ Positive stress | May be intense, but **resolves quickly**',
            '+ Tolerable stress | Lasts longer (like grief), but can be **softened through healthy relationships**',
            '+ Toxic stress | **Intense, prolonged adversity without support**',
          ),
          '> Remember: Stress is **cumulative** and overload is normal. **Early support prevents crisis.**',
        ),
      },
      {
        heading: 'Signs someone may be struggling',
        body: blocks(
          'Common signs of **distress** include:',
          lines(
            '- Feeling hopeless, helpless or constantly anxious',
            '- Sudden mood swings or emotional outbursts',
            '- Loss of interest in things they used to enjoy',
            '- Feeling numb, stuck or disconnected',
            '- Trouble sleeping or sleeping too much',
            '- Avoiding friends or responsibilities',
            '- Using alcohol or substances to cope',
            '- Crying often or feeling on the edge',
          ),
          '> Watch out: Some struggles are easy to notice; many stay **hidden behind a smile**.',
          lines(
            '?? A friend always seems cheerful, but lately they have stopped coming to meals and reply to messages less. What could you do?',
            '= Gently check in, in private. For example: "I’ve missed you at meals lately. How are you doing?" Then listen, without pressure.',
          ),
        ),
      },
      {
        heading: 'What students at ALU are carrying',
        body: blocks(
          'Common stressors for students include:',
          lines(
            '- **Relationships**: friendships, dating norms, finding a community, a lack of belonging',
            '- **Culture shock**: adjusting to a new culture or social environment',
            '- **Academic and professional stress**: new teaching styles, deadlines, workload, internships',
            '- **Family**: missing home, expectations, financial pressure',
            '- **Financial strain**: pressure to send money home, balancing a budget',
          ),
          '> Example: One scholar named it **"Unseen Weight"**: "It felt like carrying an invisible load. Physical exhaustion without reason, overwhelmed by small tasks."',
        ),
      },
    ],
    quiz: [
      {
        prompt: 'Before exams, a student is irritable, procrastinating and sleeping badly, but still managing. Where are they on the continuum?',
        options: ['Healthy', 'Reacting', 'Ill'],
        answerIndex: 1,
        explanation: 'Irritability, procrastination and poor sleep are common, reversible signs of the Reacting zone.',
      },
      {
        prompt: 'Which type of stress comes from intense, prolonged adversity without support?',
        options: ['Toxic stress', 'Positive stress', 'Tolerable stress'],
        answerIndex: 0,
        explanation: 'Toxic stress is intense and prolonged, without support. Healthy relationships can make stress more tolerable.',
      },
      {
        prompt: 'Which zones of the continuum usually call for professional care?',
        options: ['Healthy and Reacting', 'Only Healthy', 'Injured and Ill'],
        answerIndex: 2,
        explanation: 'Injured and Ill involve significant impairment and usually need professional care.',
      },
      {
        prompt: 'Which statement about stress is true?',
        options: ['Stress is always a sign of illness', 'Stress is cumulative, and early support helps prevent crisis', 'Stress should be ignored until it passes'],
        answerIndex: 1,
        explanation: 'Stress builds up over time. Overload is normal, and early support prevents crisis.',
      },
      {
        prompt: 'Which of these can be a sign of distress?',
        options: ['Avoiding friends and responsibilities', 'Enjoying usual activities', 'Sleeping well and feeling rested'],
        answerIndex: 0,
        explanation: 'Withdrawing from friends and responsibilities is a common sign someone may be struggling.',
      },
    ],
  },
  {
    slug: 'psychological-first-aid',
    title: 'Psychological First Aid: Look, Listen, Link',
    topic: 'Active listening',
    summary: 'Kind, practical support for someone in distress, using the three PFA actions.',
    estimatedMinutes: 15,
    version: 2,
    sections: [
      {
        heading: 'What is Psychological First Aid?',
        body: blocks(
          '**Psychological First Aid (PFA)** means giving kind and helpful support to someone who is upset, scared or going through a hard time (WHO, 2022). At university it means **listening, ensuring safety and connecting** people to appropriate help.',
          '**PFA is:**',
          lines(
            '- Comforting someone in distress and helping them feel **safe and calm**',
            '- Noticing their **immediate needs** and concerns',
            '- Protecting them from further harm',
            '- Listening with empathy, **without judgment**',
            '- Helping them reach information, campus services and social support',
          ),
          '> Watch out: PFA is **not** professional counselling, medical treatment, or forcing or pressuring someone to talk about what happened.',
          'PFA has three actions. Tap each to preview it:',
          lines(
            '+ LOOK | Observe the situation and the person: safety, basic needs and signs of distress',
            '+ LISTEN | Be fully present and try to understand what they feel and need',
            '+ LINK | Connect them with information, services and their own support',
          ),
          '> Remember: PFA is about **being there**, and being ready to listen if they want to.',
        ),
      },
      {
        heading: 'LOOK',
        body: blocks(
          '**LOOK** means carefully observing the situation, the environment and the person, to see who may need help and whether it is safe and helpful to approach.',
          'Look for:',
          lines(
            '- **Safety**: is the person physically safe? Is the environment safe?',
            '- **Basic needs**: water, food, rest, medical care',
            '- **Signs of distress**: physical, emotional or behavioural',
            '- **Serious needs**: signs of injury or a need for urgent help',
            '- **Who needs help now**, and who can be supported later',
          ),
          '> Tip: Check **safety first**: the person’s physical safety and the safety of the environment.',
        ),
      },
      {
        heading: 'LISTEN',
        body: blocks(
          'Listening is more than hearing. It means being **fully present**, paying close attention, and trying to understand what the person has experienced, how they feel and what they need.',
          '> Watch out: Notice when they do not want to talk, and **respect silence**.',
          'Active listening is **verbal and non-verbal**. These all communicate:',
          lines('- Facial expressions', '- Tone of voice', '- Eye contact', '- Gestures', '- Posture'),
          '> Tip: Be **alongside, not above**. Choose presence over advice.',
          'When you approach someone in distress, **introduce yourself** and explain how you can help. Think about what would help them feel safe straight away.',
          lines(
            '? A peer is telling you about a hard week. Which response shows active listening?',
            '[ ] Checking your phone while nodding along',
            '[x] Facing them, keeping a calm tone and letting pauses happen',
            '[ ] Quickly telling them about a time you felt the same',
            '= Active listening is verbal **and** non-verbal: your posture, tone and eye contact show you are present, and silence is respected.',
          ),
        ),
      },
      {
        heading: 'Calming someone in distress',
        body: blocks(
          lines(
            '- Keep your tone of voice **calm and soft**',
            '- If culturally appropriate, try to keep **eye contact** as you talk',
            '- Remind them you are there to help, and that they are safe',
            '- Encourage them to focus on their **breathing** and breathe slowly',
          ),
          '> Watch out: Only tell someone they are safe **if it is true**.',
          '> Try this: Breathe slowly **together** with them, so they can follow your pace.',
        ),
      },
      {
        heading: 'LINK',
        body: blocks(
          '**LINK** means helping the person connect with what they need:',
          lines(
            '- **Information**',
            '- **Campus services**, like the Wellness Center',
            '- **Their own social support**, such as trusted friends, family or faith community',
          ),
          '> Remember: Look, Listen and Link do **not** have to happen in that order. In real situations they mix, and sometimes happen at the same time.',
          '> Tip: Beacon’s **Directory** lists campus and local services you can link people to.',
        ),
      },
    ],
    quiz: [
      {
        prompt: 'In PFA, what is the first thing to LOOK for?',
        options: ['Who caused the situation', 'Safety: is the person and the environment safe?', 'Whether they will pass their exams'],
        answerIndex: 1,
        explanation: 'Safety comes first: the person’s physical safety and the safety of the environment.',
      },
      {
        prompt: 'Which of these is part of active listening?',
        options: ['Planning your advice while they talk', 'Finishing their sentences to show you understand', 'Being fully present, including respecting silence'],
        answerIndex: 2,
        explanation: 'Active listening means full attention, verbal and non-verbal, and respecting when someone does not want to talk.',
      },
      {
        prompt: 'Which of these is NOT Psychological First Aid?',
        options: ['Pressuring someone to share the details of what happened', 'Helping someone feel safe and calm', 'Connecting someone to campus services'],
        answerIndex: 0,
        explanation: 'PFA never forces or pressures anyone to talk. It is about being ready to listen if they want to.',
      },
      {
        prompt: 'Which is a good way to help calm someone in distress?',
        options: ['Tell them firmly to calm down', 'Keep your voice calm and soft, and encourage slow breathing', 'Raise your voice so they focus on you'],
        answerIndex: 1,
        explanation: 'A calm, soft tone and slow breathing help someone settle.',
      },
      {
        prompt: 'In PFA, LINK means…',
        options: [
          'Connecting someone to information, campus services and social support',
          'Sharing their story with friends so they can help',
          'Linking them to online advice articles only',
        ],
        answerIndex: 0,
        explanation: 'LINK connects people with services and their own support networks, with their consent.',
      },
    ],
  },
  {
    slug: 'boundaries-confidentiality',
    title: 'Boundaries & Confidentiality',
    topic: 'Boundaries',
    summary: 'What confidentiality means, where it ends, and how healthy boundaries protect everyone.',
    estimatedMinutes: 12,
    version: 2,
    sections: [
      {
        heading: 'What confidentiality means',
        body: blocks(
          '**Confidentiality** means keeping what a peer shares with you private. It is a big part of what makes students feel safe enough to open up; many hesitate to seek support because they **fear judgment or gossip**.',
          '> Watch out: Confidentiality does **not** mean keeping a secret when someone may be at risk.',
          'Explain the limits clearly, ideally **at the start**.',
          '> Example: "What you share stays between us, unless I am worried about your safety. If that happens, I would involve the Wellness Center, and I would tell you first."',
          lines(
            '? When is the best time to explain the limits of confidentiality?',
            '[x] At the start, before they share',
            '[ ] Only if something risky comes up',
            '[ ] Never, so they keep trusting you',
            '= Explain the limits clearly, ideally **at the start**, so there are no surprises later.',
          ),
        ),
      },
      {
        heading: 'When you must involve others immediately',
        body: blocks(
          '**Silence can cause harm.** Involve others immediately if a peer:',
          lines(
            '- Talks about **hurting themselves**',
            '- Feels **unsafe**',
            '- Is **extremely distressed**',
            '- Asks you to keep a **dangerous secret**',
          ),
          '> Watch out: **Never promise secrecy** in these situations.',
          '> Remember: Contact the **Wellness Center** straight away and stay connected appropriately.',
        ),
      },
      {
        heading: 'Healthy boundaries',
        body: blocks(
          'Boundaries keep support **safe and sustainable**, for the peer and for you.',
          'Success is **NOT**:',
          lines(
            '- Being available all the time',
            '- Carrying someone alone',
            '- Forcing someone to change or seek help',
            '- Taking responsibility for another person’s healing',
          ),
          '> Remember: **No peer holds risk alone**, and sustainability is institutional, not individual.',
        ),
      },
      {
        heading: 'Common dilemmas',
        body: blocks(
          'The training names situations peer counselors often face:',
          lines(
            '- **Emotional dependency**: someone relies only on you',
            '- **Romantic boundaries**',
            '- **Faith-related help-seeking**',
            '- **Financial vulnerability**: for example, being asked for money',
            '- **Referral concerns**: someone does not want to be referred',
          ),
          lines(
            '?? A peer you support starts messaging you late every night and says you are the only one who understands them. What could you do?',
            '= This may be **emotional dependency**. Talk it through with your supervisor or the Wellness Center, and gently help them widen their circle of support, so you are not their only source of care.',
          ),
          '> Remember: There is rarely one perfect answer. Talk these through with your **supervisor or the Wellness Center**; you do not have to decide alone.',
        ),
      },
      {
        heading: 'Culture, faith and context',
        body: blocks(
          'In our communities, support often comes from **family, friends, faith and elders**.',
          'Be sensitive to each person’s **faith, family, identity and lived experience**.',
          '> Tip: Praying or reflecting can be a meaningful part of coping for some people. Respect what is meaningful to them, **without imposing your own beliefs**.',
        ),
      },
    ],
    quiz: [
      {
        prompt: 'A peer asks you to promise you will never tell anyone what they are about to share. What is the best response?',
        options: [
          'Promise, so they feel able to trust you',
          'Explain kindly that you keep things private unless you are worried about their safety',
          'Refuse to listen until they agree you can tell others',
        ],
        answerIndex: 1,
        explanation: 'Be honest about the limits of confidentiality before they share. Never promise secrecy you may not be able to keep.',
      },
      {
        prompt: 'When must you involve others immediately?',
        options: ['A peer is stressed about a deadline', 'A peer had an argument with a friend', 'A peer talks about hurting themselves'],
        answerIndex: 2,
        explanation: 'Talk of self-harm, feeling unsafe, extreme distress or a dangerous secret means involving the Wellness Center straight away.',
      },
      {
        prompt: '"No peer holds risk alone" means…',
        options: [
          'Responsibility for risk is shared with the Wellness Center',
          'You should handle risky situations quietly by yourself',
          'Risky situations are not your concern',
        ],
        answerIndex: 0,
        explanation: 'Clinical and safeguarding responsibility sits with the Wellness Center. You are never expected to carry risk alone.',
      },
      {
        prompt: 'Being available to a peer at all hours is…',
        options: ['A sign of a great peer counselor', 'Not expected, and it can harm you and the support you give', 'Required by the programme'],
        answerIndex: 1,
        explanation: 'Success is not being available all the time. Healthy boundaries keep support sustainable.',
      },
    ],
  },
  {
    slug: 'referral-with-care',
    title: 'Referral with Care',
    topic: 'Referral',
    summary: 'Recognise when care needs to widen, and connect peers to help without letting go.',
    estimatedMinutes: 12,
    version: 2,
    sections: [
      {
        heading: 'When care needs to widen',
        body: blocks(
          '**Care needs to widen** when:',
          lines('- Distress **persists**', '- Functioning **declines**', '- Safety feels **uncertain**', '- You feel **out of your depth**'),
          'Refer to **trained professionals** if a student:',
          lines(
            '- Talks about **suicide or self-harm**',
            '- Shows signs of **aggression or violence**',
            '- Seems **disoriented**',
            '- Becomes **non-responsive or disconnected**, for example withdrawing from classes and social life for weeks',
          ),
          lines(
            '? A peer has withdrawn from classes and friends for several weeks and seems disconnected. What should you do?',
            '[ ] Give them space until they feel better',
            '[x] Refer them to trained professionals, and stay connected',
            '[ ] Keep checking in, but involve no one else',
            '= Withdrawing for weeks is a sign that care needs to **widen**. Refer to professionals, while staying connected appropriately.',
          ),
        ),
      },
      {
        heading: 'Referral is relational widening',
        body: blocks(
          '**Referral adds support; it does not remove relationship.** No circle replaces another.',
          lines(
            '1. Explain **why** more support could help',
            '2. **Stay connected** appropriately',
            '3. Offer to **walk with them** to the Wellness Center',
            '4. **Check in** afterwards, if they are comfortable with that',
          ),
          '> Example: You can say: "I want to help, but we need more support."',
        ),
      },
      {
        heading: 'What to do if there is risk',
        body: blocks(
          'Risk includes **self-harm, suicide, violence and abuse**. If you see risk:',
          lines(
            '1. **Stay calm**',
            '2. **Do not promise secrecy**',
            '3. **Contact the Wellness Center** immediately',
            '4. **Stay connected** appropriately',
          ),
          '> Watch out: If someone is in **immediate danger**, contact emergency services first.',
        ),
      },
      {
        heading: 'The Wellness Center’s role',
        body: blocks(
          'The Wellness Center:',
          lines(
            '- Provides **professional guidance**',
            '- Holds **safeguarding and safety responsibility**',
            '- Receives referrals when care widens',
            '- **Supports and protects** peer supporters',
          ),
          '> Tip: Use Beacon’s **Directory** to find the right campus or local service, and **log a session** to record a referral.',
        ),
      },
    ],
    quiz: [
      {
        prompt: 'Which situation suggests that care needs to widen?',
        options: ['A peer had one bad day', 'A peer’s distress persists and their functioning is declining', 'A peer wants to vent about a group project'],
        answerIndex: 1,
        explanation: 'Persistent distress, declining functioning, uncertain safety, or feeling out of your depth all mean care should widen.',
      },
      {
        prompt: 'A peer talks about suicide. What are the right steps?',
        options: [
          'Stay calm, do not promise secrecy, contact the Wellness Center immediately, and stay connected',
          'Keep it between you so they keep trusting you',
          'Wait a few days to see if the feeling passes',
        ],
        answerIndex: 0,
        explanation: 'These are the four steps from the training. Contact emergency services first if someone is in immediate danger.',
      },
      {
        prompt: 'Referral means…',
        options: ['Handing someone over and stepping away', 'Telling them to find help themselves', 'Adding support while staying connected appropriately'],
        answerIndex: 2,
        explanation: 'Referral adds support; it does not remove relationship.',
      },
      {
        prompt: 'Who holds safeguarding responsibility?',
        options: ['The Wellness Center', 'The peer counselor', 'The student’s classmates'],
        answerIndex: 0,
        explanation: 'The Wellness Center holds safeguarding and safety responsibility and supports peer supporters.',
      },
    ],
  },
  {
    slug: 'caring-for-yourself',
    title: 'Caring for Yourself',
    topic: 'Self-care',
    summary: 'Notice when you are carrying too much, and how to step back and stay well.',
    estimatedMinutes: 10,
    version: 2,
    sections: [
      {
        heading: 'Peer support should not harm you',
        body: blocks(
          'Sometimes helping starts to feel like a burden. This can happen to anyone.',
          '> Remember: It does not mean you are weak; it means you are **human**.',
          'Supporting others should **not** destroy your peace, harm your studies, or exhaust you.',
        ),
      },
      {
        heading: 'Warning signs you are carrying too much',
        body: blocks(
          lines(
            '- You think about someone’s problems **all the time**',
            '- You feel pressure to **always be available**',
            '- You feel **guilty when you rest**',
            '- You are **losing sleep**',
            '- Your **studies are affected**',
          ),
          'Warning signs mean:',
          lines('- You need **support too**', '- You need to **step back**', '- You should **not continue alone**'),
          lines(
            '? You keep thinking about a peer’s problems at night and feel guilty when you rest. What does this tell you?',
            '[ ] You are a dedicated peer counselor, so keep going',
            '[x] You are carrying too much and need support too',
            '[ ] You should hide it so the peer does not worry',
            '= Constant worry and guilt about resting are **warning signs**. Step back and get support for yourself.',
          ),
        ),
      },
      {
        heading: 'Stepping back is healthy',
        body: blocks(
          'You can say:',
          lines(
            '- "This is more than I can handle alone."',
            '- "Let’s involve someone else."',
            '- "I want to help, but we need more support."',
          ),
          '> Remember: **No one should carry everything alone.** In our communities support is shared, problems are not carried by one person, and family, friends, faith and services all matter.',
        ),
      },
      {
        heading: 'Protecting yourself is part of peer support',
        body: blocks(
          'Protect yourself by:',
          lines(
            '- **Resting** and sleeping',
            '- Taking **breaks**',
            '- **Talking** to trusted people',
            '- **Praying or reflecting**, if that is meaningful to you',
            '- Doing something that **relaxes** you',
          ),
          '> Remember: You have **permission to pause** or step back.',
          '> Try this: Use Beacon’s **Reflect** check-in after a heavy conversation, and talk to the Wellness Center if you are struggling.',
        ),
      },
    ],
    quiz: [
      {
        prompt: 'Which of these is a warning sign that you are carrying too much?',
        options: ['Feeling guilty when you rest', 'Enjoying time with friends', 'Sleeping well'],
        answerIndex: 0,
        explanation: 'Guilt when resting, constant worry about someone, and lost sleep are signs you need support too.',
      },
      {
        prompt: 'When you notice warning signs in yourself, you should…',
        options: ['Push through, because others need you', 'Step back and seek support for yourself', 'Stop replying to everyone without explanation'],
        answerIndex: 1,
        explanation: 'Warning signs mean you need support too and should not continue alone. Step back with care.',
      },
      {
        prompt: '"Sustainability is institutional, not individual" means…',
        options: [
          'You personally must keep everyone going',
          'Peer support only lasts if one person leads it',
          'The programme and Wellness Center, not you alone, keep support going',
        ],
        answerIndex: 2,
        explanation: 'Support is shared. The institution, not any single peer, carries the responsibility.',
      },
      {
        prompt: 'Which is a healthy thing to say when you need to step back?',
        options: ['"I’ll always be here, any time you need."', '"Let’s involve someone else."', '"Don’t message me again."'],
        answerIndex: 1,
        explanation: 'Stepping back kindly, and widening support, protects both of you.',
      },
    ],
  },
];
