// Training modules adapted from the Solid Minds Counselling Clinic "PEERS
// Circles of Care" peer counselor training delivered at ALU (May 2026):
//   - Peer Counselor Training, Day 1 (Foundations: care, context & role)
//   - Day 2: Mental Health 101 & the Foundations of Responsible Peer Counseling
//   - Peer Support Programs for Student Wellbeing
//   - Group discussion briefs (safe spaces, caring for the carer, the club)
// Wording is adapted for short mobile lessons and is pending Solid Minds' final
// review (content_verified = false until they approve it in the Admin screens).
import type { ModuleContent } from './types';

export const SOURCE_NOTE =
  'Adapted from the Solid Minds Counselling Clinic PEERS Circles of Care training (ALU, May 2026). Pending final review by Solid Minds.';

export const modules: ModuleContent[] = [
  {
    slug: 'peers-model',
    title: 'Peer Support & the PEERS Model',
    topic: 'Role clarity',
    summary: 'Why peer support exists at ALU, what care means, and what your role is (and is not).',
    estimatedMinutes: 12,
    sections: [
      {
        heading: 'Why peer support at ALU?',
        body:
          'Students rarely start with professionals. When life gets heavy, most students turn first to people they already trust.\n\n' +
          '- Students first seek support from peers and faith communities\n- Wellness staff are limited in number\n- Belonging is protective\n- Early relational support reduces crisis escalation\n\n' +
          'In a Solid Minds survey of Rwandan university students, 81% said they feel comfortable reaching out to a friend when they are emotionally struggling, far more than any other source of support. The PEERS programme strengthens what already exists in student life, safely and with professional oversight.',
      },
      {
        heading: 'How students seek help',
        body:
          'Students tend to look for support in this order:\n\n' +
          '- Meaning: faith, spiritual life, self-care\n- Belonging: best friends and trusted peers\n- Unconditional care: a mother or mother figure\n- Shared life: siblings\n- Authority figures: fathers, mentors\n- Professional counselling\n\n' +
          'The programme aligns with this lived order rather than replacing it. As a peer, you are often the first door someone knocks on.',
      },
      {
        heading: 'What care means',
        body:
          'Care is relational accompaniment: staying with another person in ways that preserve dignity, distribute responsibility, and widen support as needs increase, without breaking connection.\n\n' +
          '"I am because we are." Peer support comes not from techniques but from presence, relationship and community. You walk with, not ahead of, someone.',
      },
      {
        heading: 'The PEERS model',
        body:
          '- P: Presence. Being fully with the person.\n- E: Empathy. Trying to understand how they feel.\n- E: Early support. Noticing and checking in before things escalate.\n- R: Referral with care. Widening support without letting go.\n- S: Shared responsibility. No one carries everything alone.',
      },
      {
        heading: 'What peer counseling is, and is not',
        body:
          'Peer counseling IS:\n\n- Listening\n- Checking in\n- Emotional support and encouragement\n- Helping someone feel less alone\n- A liaison to the Wellness Center\n- Outreach support\n\n' +
          'Peer counseling is NOT:\n\n- Therapy\n- Fixing people\n- Diagnosing\n- Carrying someone alone\n- Replacing professionals\n\n' +
          'What you do: notice, check in, stay present, normalise struggle and help care widen. What you do not do: diagnose, treat, or manage a crisis alone.',
      },
      {
        heading: 'Principles and what success looks like',
        body:
          'These principles govern the whole programme:\n\n- Care widens as needs increase\n- No circle replaces another\n- Referral adds support; it does not remove relationship\n- Peer support is relational, not clinical\n- No peer holds risk alone\n- Clinical responsibility remains with the Wellness Center\n- Sustainability is institutional, not individual\n\n' +
          'Success is not fixing someone, having all the answers or being available all the time. Sometimes success looks like a student who felt safe enough to open up, felt heard and less alone, took one small positive step, or accepted more support when they needed it.',
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
    sections: [
      {
        heading: 'What we mean by mental health',
        body:
          'Mental health is the capacity to think, feel and act in ways that enhance our ability to enjoy life (being happy, productive, social) and to deal with challenges.\n\n' +
          'A mental health problem is diminished capacity (cognitive, emotional, behavioural) that interferes with enjoying life and interacting with our society and environment.\n\n' +
          'A mental disorder is a condition that affects a person’s thinking, feeling, mood and behaviour in ways that impair their ability to socialise with others and function each day.',
      },
      {
        heading: 'We all move along a continuum',
        body:
          'Mental health is not "well" or "ill". We all move along a spectrum:\n\n' +
          '- Healthy: normal mood changes, taking things in stride, consistent performance, normal sleep, socially active\n' +
          '- Reacting: irritable or nervous, sadness, worrying, procrastination, trouble sleeping, lower energy\n' +
          '- Injured: anger, anxiety, lingering sadness, hopelessness, preoccupation, falling performance\n' +
          '- Ill: significant difficulty with emotions and thinking, high anxiety or panic attacks, depressed mood, constant fatigue\n\n' +
          'Healthy and Reacting are usually helped by self-care and social support. Injured and Ill usually need professional care.',
      },
      {
        heading: 'Stress, distress and crisis',
        body:
          'Common signs of stress among students: constant exhaustion, loss of motivation, difficulty concentrating, sleep problems, headaches or tension, withdrawal, and leaning on caffeine or alcohol to cope.\n\n' +
          'Not all stress is the same:\n\n- Positive stress may be intense but resolves quickly\n- Tolerable stress lasts longer (like grief) but can be softened through healthy relationships\n- Toxic stress is intense, prolonged adversity without support\n\n' +
          'Stress is cumulative and overload is normal. Early support prevents crisis.',
      },
      {
        heading: 'Signs someone may be struggling',
        body:
          'Common signs of distress include:\n\n- Feeling hopeless, helpless or constantly anxious\n- Sudden mood swings or emotional outbursts\n- Loss of interest in things they used to enjoy\n- Feeling numb, stuck or disconnected\n- Trouble sleeping or sleeping too much\n- Avoiding friends or responsibilities\n- Using alcohol or substances to cope\n- Crying often or feeling on the edge\n\n' +
          'Some struggles are easy to notice; many stay hidden behind a smile.',
      },
      {
        heading: 'What students at ALU are carrying',
        body:
          'Common stressors for students include:\n\n- Relationships: friendships, dating norms, finding a community, a lack of belonging\n- Culture shock: adjusting to a new culture or social environment\n- Academic and professional stress: new teaching styles, deadlines, workload, internships\n- Family: missing home, expectations, financial pressure\n- Financial strain: pressure to send money home, balancing a budget\n\n' +
          'One scholar named it "Unseen Weight": "It felt like carrying an invisible load. Physical exhaustion without reason, overwhelmed by small tasks."',
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
    sections: [
      {
        heading: 'What is Psychological First Aid?',
        body:
          'Psychological First Aid (PFA) means giving kind and helpful support to someone who is upset, scared or going through a hard time (WHO, 2022). At university it means listening, ensuring safety and connecting people to appropriate help.\n\n' +
          'PFA is:\n\n- Comforting someone in distress and helping them feel safe and calm\n- Noticing their immediate needs and concerns\n- Protecting them from further harm\n- Listening with empathy, without judgment\n- Helping them reach information, campus services and social support\n\n' +
          'PFA is NOT professional counselling, medical treatment, or forcing or pressuring someone to talk about what happened. It is about being there and ready to listen if they want to.',
      },
      {
        heading: 'LOOK',
        body:
          'LOOK means carefully observing the situation, the environment and the person, to see who may need help and whether it is safe and helpful to approach.\n\nLook for:\n\n' +
          '- Safety: is the person physically safe? Is the environment safe?\n- Basic needs: water, food, rest, medical care\n- Signs of distress: physical, emotional or behavioural\n- Serious needs: signs of injury or a need for urgent help\n- Who may need help now, and who can be supported later',
      },
      {
        heading: 'LISTEN',
        body:
          'Listening is more than hearing. It means being fully present, paying close attention, and trying to understand what the person has experienced, how they feel and what they need. It also means noticing when they do not want to talk, and respecting silence.\n\n' +
          'Active listening is verbal and non-verbal: facial expressions, tone of voice, eye contact, gestures and posture all communicate. Be alongside, not above. Choose presence over advice.\n\n' +
          'When you approach someone in distress, introduce yourself and explain how you can help. Think about what would help them feel safe straight away.',
      },
      {
        heading: 'Calming someone in distress',
        body:
          '- Keep your tone of voice calm and soft\n- If culturally appropriate, try to keep eye contact as you talk\n- Remind them you are there to help, and that they are safe (only if it is true)\n- Encourage them to focus on their breathing and breathe slowly',
      },
      {
        heading: 'LINK',
        body:
          'LINK means helping the person connect with what they need: information, campus services (like the Wellness Center), and their own social support, such as trusted friends, family or faith community.\n\n' +
          'Look, Listen and Link do not have to happen in that order. In real situations they mix, and sometimes happen at the same time.',
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
    sections: [
      {
        heading: 'What confidentiality means',
        body:
          'Confidentiality means keeping what a peer shares with you private. It is a big part of what makes students feel safe enough to open up; many hesitate to seek support because they fear judgment or gossip.\n\n' +
          'Confidentiality does NOT mean keeping a secret when someone may be at risk. Explain the limits clearly, ideally at the start. For example: "What you share stays between us, unless I am worried about your safety. If that happens, I would involve the Wellness Center, and I would tell you first."',
      },
      {
        heading: 'When you must involve others immediately',
        body:
          'Silence can cause harm. Involve others immediately if a peer:\n\n- Talks about hurting themselves\n- Feels unsafe\n- Is extremely distressed\n- Asks you to keep a dangerous secret\n\n' +
          'Never promise secrecy in these situations. Contact the Wellness Center straight away and stay connected appropriately.',
      },
      {
        heading: 'Healthy boundaries',
        body:
          'Boundaries keep support safe and sustainable, for the peer and for you. Success is NOT:\n\n- Being available all the time\n- Carrying someone alone\n- Forcing someone to change or seek help\n- Taking responsibility for another person’s healing\n\n' +
          'Remember: no peer holds risk alone, and sustainability is institutional, not individual.',
      },
      {
        heading: 'Common dilemmas',
        body:
          'The training names situations peer counselors often face:\n\n- Emotional dependency: someone relies only on you\n- Romantic boundaries\n- Faith-related help-seeking\n- Financial vulnerability: for example, being asked for money\n- Referral concerns: someone does not want to be referred\n\n' +
          'There is rarely one perfect answer. Talk these through with your supervisor or the Wellness Center; you do not have to decide alone.',
      },
      {
        heading: 'Culture, faith and context',
        body:
          'In our communities, support often comes from family, friends, faith and elders. Be sensitive to each person’s faith, family, identity and lived experience. Praying or reflecting can be a meaningful part of coping for some people; respect what is meaningful to them, without imposing your own beliefs.',
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
    sections: [
      {
        heading: 'When care needs to widen',
        body:
          'Care needs to widen when:\n\n- Distress persists\n- Functioning declines\n- Safety feels uncertain\n- You feel out of your depth\n\n' +
          'Refer to trained professionals if a student:\n\n- Talks about suicide or self-harm\n- Shows signs of aggression or violence\n- Seems disoriented\n- Becomes non-responsive or disconnected, for example withdrawing from classes and social life for weeks',
      },
      {
        heading: 'Referral is relational widening',
        body:
          'Referral adds support; it does not remove relationship. No circle replaces another.\n\n- Explain why more support could help\n- Stay connected appropriately\n- Offer to walk with them to the Wellness Center\n- Check in afterwards, if they are comfortable with that\n\n' +
          'You can say: "I want to help, but we need more support."',
      },
      {
        heading: 'What to do if there is risk',
        body:
          'Risk includes self-harm, suicide, violence and abuse. If you see risk:\n\n1. Stay calm\n2. Do not promise secrecy\n3. Contact the Wellness Center immediately\n4. Stay connected appropriately\n\n' +
          'If someone is in immediate danger, contact emergency services first.',
      },
      {
        heading: 'The Wellness Center’s role',
        body:
          'The Wellness Center:\n\n- Provides professional guidance\n- Holds safeguarding and safety responsibility\n- Receives referrals when care widens\n- Supports and protects peer supporters\n\n' +
          'Use Beacon’s Directory to find the right campus or local service, and log a session to record a referral.',
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
    sections: [
      {
        heading: 'Peer support should not harm you',
        body:
          'Sometimes helping starts to feel like a burden. This can happen to anyone. It does not mean you are weak; it means you are human.\n\n' +
          'Supporting others should not destroy your peace, harm your studies, or exhaust you.',
      },
      {
        heading: 'Warning signs you are carrying too much',
        body:
          '- You think about someone’s problems all the time\n- You feel pressure to always be available\n- You feel guilty when you rest\n- You are losing sleep\n- Your studies are affected\n\n' +
          'Warning signs mean you need support too, you need to step back, and you should not continue alone.',
      },
      {
        heading: 'Stepping back is healthy',
        body:
          'You can say:\n\n- "This is more than I can handle alone."\n- "Let’s involve someone else."\n- "I want to help, but we need more support."\n\n' +
          'No one should carry everything alone. In our communities support is shared, problems are not carried by one person, and family, friends, faith and services all matter.',
      },
      {
        heading: 'Protecting yourself is part of peer support',
        body:
          'Protect yourself by:\n\n- Resting and sleeping\n- Taking breaks\n- Talking to trusted people\n- Praying or reflecting, if that is meaningful to you\n- Doing something that relaxes you\n\n' +
          'You have permission to pause or step back. Use Beacon’s Reflect check-in after a heavy conversation, and talk to the Wellness Center if you are struggling.',
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
