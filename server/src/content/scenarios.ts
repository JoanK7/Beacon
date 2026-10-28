// Scenario role-plays: short branching conversations with a simulated peer.
// Each practises skills from the Solid Minds PEERS training. An unhelpful
// choice shows its realistic consequence and Bea's feedback, then lets the
// learner try again; there is no way to "fail". Pending Solid Minds review.
import type { ScenarioContent } from './types';

export const scenarios: ScenarioContent[] = [
  {
    slug: 'exam-week-overwhelm',
    moduleSlug: 'psychological-first-aid',
    title: 'Overwhelmed in the library',
    summary: 'A classmate is overwhelmed by deadlines. Practise Look, Listen and Link.',
    persona: { name: 'Aline', context: 'Second-year student, exam week', tone: 'sky' },
    script: {
      start: 'arrive',
      nodes: {
        arrive: {
          kind: 'step',
          scene: 'It is exam week. In the library you notice Aline, a classmate, with her head in her hands and her laptop closed.',
          says: 'I have three deadlines this week and I just… I can’t think straight anymore.',
          choices: [
            {
              text: '"You’ll be fine. Everyone has deadlines right now."',
              quality: 'unhelpful',
              reaction: 'Aline goes quiet. "…Yeah. I guess."',
              feedback: 'Minimising can leave someone feeling dismissed, even when we mean to reassure. Try acknowledging what she is feeling first.',
            },
            {
              text: '"That sounds like a lot to carry at once. Do you want to sit and talk for a bit?"',
              quality: 'helpful',
              reaction: 'Aline looks up and nods. "Actually… yes. Thank you."',
              feedback: 'Lovely. You noticed her (LOOK) and offered presence before anything else. That is the P in PEERS.',
              next: 'pressure',
            },
            {
              text: '"Here’s what you should do: make a timetable and start with the hardest one."',
              quality: 'okay',
              reaction: 'Aline sighs. "I know… I just can’t even start."',
              feedback: 'Well meant, but advice can come later. Presence before advice: first help her feel heard.',
              next: 'pressure',
            },
          ],
        },
        pressure: {
          kind: 'step',
          says: 'I haven’t slept properly in days. And my family keeps asking about my grades, like everything depends on me.',
          choices: [
            {
              text: '"So it’s not only the work. There’s pressure from home too, and you’re exhausted."',
              quality: 'helpful',
              reaction: 'Aline’s shoulders drop a little. "Exactly. Nobody gets that part."',
              feedback: 'Great reflecting. Naming both the workload and the family pressure shows you were really listening.',
              next: 'panic',
            },
            {
              text: '"At least your family cares about you!"',
              quality: 'unhelpful',
              reaction: 'Aline frowns. "That’s… not really the point."',
              feedback: '"At least…" responses quietly argue with someone’s feelings. Family expectations are a common source of stress for students.',
            },
            {
              text: '"Have you tried more coffee? That gets me through exams."',
              quality: 'unhelpful',
              reaction: 'Aline gives a tired smile. "I’ve had four today."',
              feedback: 'Relying on caffeine to cope is actually one of the common signs of stress. Stay with how she is feeling instead.',
            },
          ],
        },
        panic: {
          kind: 'step',
          scene: 'Aline’s breathing speeds up and she presses a hand to her chest.',
          says: 'Sorry, my chest feels tight. I think I’m panicking a bit.',
          choices: [
            {
              text: '"That’s okay, I’m right here. Let’s breathe slowly together. In… and out."',
              quality: 'helpful',
              reaction: 'You breathe together for a minute. Aline’s breathing slows. "Okay… okay. That helped."',
              feedback: 'A calm, soft voice, reassurance and slow breathing are exactly the calming steps from PFA.',
              next: 'link',
            },
            {
              text: '"Calm down. People are looking at us."',
              quality: 'unhelpful',
              reaction: 'Aline’s eyes fill with tears and she turns away.',
              feedback: 'Being told to calm down rarely helps, and attention from others can add shame. Try a calm voice and slow breathing together.',
            },
            {
              text: '"Do you want to step outside for some fresh air with me?"',
              quality: 'okay',
              reaction: 'Outside, Aline breathes a little easier.',
              feedback: 'Moving somewhere calmer can help. Adding slow, guided breathing would help even more.',
              next: 'link',
            },
          ],
        },
        link: {
          kind: 'step',
          says: 'Thanks. I really don’t know what to do about all of it though.',
          choices: [
            {
              text: '"Would it help to look together at who could support you? Academic advising for the deadlines, and the Wellness Center if the stress keeps building."',
              quality: 'helpful',
              reaction: 'Aline nods slowly. "Yeah. Could we look now?"',
              feedback: 'That is LINK: connecting her to services while letting her choose. You walked with her, not ahead of her.',
              next: 'end',
            },
            {
              text: '"Don’t worry, I’ll email your lecturers for you and sort it out."',
              quality: 'unhelpful',
              reaction: 'Aline hesitates. "Um… I’d rather not have people know."',
              feedback: 'Taking over can feel like losing control. Offer options and let her decide. You walk with, not ahead of, someone.',
            },
            {
              text: '"That’s really up to you."',
              quality: 'unhelpful',
              reaction: 'Aline nods, looking lost again.',
              feedback: 'Respecting her choice matters, but she asked for help. Gently offer options she can choose from.',
            },
          ],
        },
        end: {
          kind: 'ending',
          title: 'Aline felt heard, and knows where to go next',
          text: 'You noticed her, stayed calm when she panicked, and helped her find support she chose. That is Psychological First Aid in action.',
          skills: ['Look', 'Listen', 'Calming', 'Link'],
        },
      },
    },
  },
  {
    slug: 'promise-not-to-tell',
    moduleSlug: 'referral-with-care',
    title: '"Promise you won’t tell anyone"',
    summary: 'A friend shares something worrying and asks you to keep it secret. Practise responding to risk.',
    persona: { name: 'Kwame', context: 'A friend from your cohort', tone: 'lavender' },
    sensitive: true,
    script: {
      start: 'secret',
      nodes: {
        secret: {
          kind: 'step',
          scene: 'Late one evening, Kwame messages you and asks if you can talk somewhere quiet.',
          says: 'Can I tell you something? But only if you promise not to tell anyone.',
          choices: [
            {
              text: '"Of course. I promise, it stays between us."',
              quality: 'unhelpful',
              reaction: 'Kwame relaxes, but you have made a promise you may not be able to keep.',
              feedback: 'Never promise secrecy before you know what it is. If someone is at risk you will need to involve others, and a broken promise can damage trust. Try explaining the limits kindly.',
            },
            {
              text: '"I’m here and I want to listen. I keep things private, but if I’m worried about your safety I’d need to get you more support. I’d tell you first."',
              quality: 'helpful',
              reaction: 'Kwame pauses, then nods. "Okay. That’s fair."',
              feedback: 'Explaining the limits of confidentiality up front is honest and builds trust.',
              next: 'share',
            },
            {
              text: '"Is it something bad?"',
              quality: 'okay',
              reaction: 'Kwame shrugs. "Kind of."',
              feedback: 'Gentle, but it is best to explain the limits of confidentiality before he shares.',
              next: 'share',
            },
          ],
        },
        share: {
          kind: 'step',
          says: 'Lately I feel like there’s no point anymore. Sometimes I think everyone would be better off without me.',
          choices: [
            {
              text: '"Thank you for trusting me with that. It sounds really painful, and I’m glad you told me."',
              quality: 'helpful',
              reaction: 'Kwame’s voice shakes. "I didn’t know who else to tell."',
              feedback: 'Step 1: stay calm. Listening without panic or judgment helps him feel safe enough to keep talking.',
              next: 'dont-tell',
            },
            {
              text: '"Don’t say things like that!"',
              quality: 'unhelpful',
              reaction: 'Kwame pulls back. "Forget it. I shouldn’t have said anything."',
              feedback: 'A shocked or judging reaction can make someone close up. Stay calm, and thank him for telling you.',
            },
            {
              text: '"Let’s talk about something happier to take your mind off it."',
              quality: 'unhelpful',
              reaction: 'Kwame goes quiet and looks away.',
              feedback: 'Changing the subject can feel like you do not want to hear it. What he shared is serious. Stay with him.',
            },
          ],
        },
        'dont-tell': {
          kind: 'step',
          says: 'Please don’t tell anyone. I don’t want to be a burden.',
          choices: [
            {
              text: '"You’re not a burden. I care about you, and this is too important for me to keep to myself. Let’s contact the Wellness Center together, right now. I’ll stay with you."',
              quality: 'helpful',
              reaction: 'Kwame is quiet for a long moment.',
              feedback: 'Steps 2 and 3: do not promise secrecy, and contact the Wellness Center immediately. No peer holds risk alone.',
              next: 'stay',
            },
            {
              text: '"Okay, I won’t tell anyone. You can always talk to me."',
              quality: 'unhelpful',
              reaction: 'Kwame thanks you, but you are now carrying this alone, and he is not getting the help he needs.',
              feedback: 'This is a dangerous secret. When someone talks about not wanting to live, you must involve others immediately. Silence can cause harm.',
            },
            {
              text: '"I’ll mention it to a lecturer tomorrow."',
              quality: 'unhelpful',
              reaction: 'Kwame looks anxious. "Who? Why a lecturer?"',
              feedback: 'Risk needs support now, from the Wellness Center, which holds safeguarding responsibility, and he should know what you are doing.',
            },
          ],
        },
        stay: {
          kind: 'step',
          says: '…Okay. Will you stay with me?',
          choices: [
            {
              text: '"Yes. I’ll stay with you while we reach out, and I’ll check in with you afterwards too."',
              quality: 'helpful',
              reaction: 'Kwame lets out a breath. "Thank you."',
              feedback: 'Step 4: stay connected appropriately. Referral adds support; it does not remove relationship.',
              next: 'end',
            },
            {
              text: '"I’ve done my part. The counselors will handle it from here."',
              quality: 'unhelpful',
              reaction: 'Kwame’s face falls.',
              feedback: 'Referral is relational widening, not handing someone off. Stay connected appropriately.',
            },
          ],
        },
        end: {
          kind: 'ending',
          title: 'You didn’t carry this alone, and neither did Kwame',
          text: 'You stayed calm, did not promise secrecy, involved the Wellness Center immediately and stayed connected. If someone is ever in immediate danger, contact emergency services first. After a conversation like this, take care of yourself too.',
          skills: ['Limits of confidentiality', 'Stay calm', 'Contact the Wellness Center', 'Stay connected'],
        },
      },
    },
  },
  {
    slug: 'always-available',
    moduleSlug: 'caring-for-yourself',
    title: 'Messages at 1 a.m.',
    summary: 'A peer you support relies on you more and more. Practise boundaries and self-care.',
    persona: { name: 'Grace', context: 'A peer you have been supporting', tone: 'coral' },
    script: {
      start: 'late',
      nodes: {
        late: {
          kind: 'step',
          scene: 'It is 1 a.m., the third night in a row. You have an exam at 9 a.m.',
          says: 'Are you awake? I really need to talk again.',
          choices: [
            {
              text: 'Reply and talk until 4 a.m. She needs you.',
              quality: 'unhelpful',
              reaction: 'You both feel a little better, but you sit your exam exhausted and anxious.',
              feedback: 'Being available all the time is not success. It wears you down, and exhausted support helps no one. Try a kind boundary.',
            },
            {
              text: '"I care about you and I want to support you properly. I need to sleep for my exam now. Can we talk tomorrow at 2 p.m.? If you feel unsafe tonight, please contact emergency services."',
              quality: 'helpful',
              reaction: 'Grace replies: "Okay. Sorry. 2 p.m. works."',
              feedback: 'A clear, warm boundary with a time to talk, plus a safety option. That protects both of you.',
              next: 'dependent',
            },
            {
              text: 'Leave the message unanswered.',
              quality: 'unhelpful',
              reaction: 'In the morning you see two more messages, each more worried.',
              feedback: 'Silence can feel like rejection, and you would not know if she needed urgent help. A short, kind boundary is better.',
            },
          ],
        },
        dependent: {
          kind: 'step',
          scene: 'The next afternoon, you meet Grace.',
          says: 'Sorry about last night. You’re the only one who gets me. I don’t know what I’d do without you.',
          choices: [
            {
              text: '"I’m really glad our talks help. I’d also love you to have more people in your corner. Have you thought about talking to someone at the Wellness Center too?"',
              quality: 'helpful',
              reaction: 'Grace thinks. "Maybe. Would you come with me the first time?"',
              feedback: 'Gently widening her support is shared responsibility. No circle replaces another.',
              next: 'you',
            },
            {
              text: '"Don’t worry, I’ll always be here for you, any time."',
              quality: 'unhelpful',
              reaction: 'Grace smiles, and you feel the weight settle on your shoulders.',
              feedback: 'This deepens emotional dependency, a common dilemma in peer support. Widen her circle instead.',
            },
            {
              text: '"You need to stop relying on me so much."',
              quality: 'unhelpful',
              reaction: 'Grace looks hurt. "Oh. Okay. Sorry for being a burden."',
              feedback: 'The boundary is valid, but the way it is said matters. Try warmth plus widening support.',
            },
          ],
        },
        you: {
          kind: 'step',
          scene: 'A week later, you notice you keep thinking about Grace’s problems, you are sleeping badly, and your coursework is slipping.',
          choices: [
            {
              text: 'Keep going. Grace needs you more than you need rest.',
              quality: 'unhelpful',
              reaction: 'A few days later you feel drained and dread opening your messages.',
              feedback: 'These are the warning signs from the training: constant worry about someone, lost sleep, studies affected. They mean you need support too.',
            },
            {
              text: 'Talk to your supervisor or the Wellness Center about how you are feeling, and do a self-care check-in.',
              quality: 'helpful',
              reaction: 'Talking it through, you feel lighter, and you agree a plan for supporting Grace together.',
              feedback: 'Stepping back is healthy. Asking for support yourself is a strength, not a weakness.',
              next: 'end',
            },
            {
              text: 'Quietly stop replying to Grace.',
              quality: 'unhelpful',
              reaction: 'Grace feels abandoned, and you feel guilty.',
              feedback: 'Stepping back should be done with care, involving others, so support widens rather than disappears.',
            },
          ],
        },
        end: {
          kind: 'ending',
          title: 'You looked after Grace and yourself',
          text: 'You set a kind boundary, widened Grace’s support, and noticed your own warning signs. Sustainability is institutional, not individual.',
          skills: ['Boundaries', 'Shared responsibility', 'Warning signs', 'Asking for help'],
        },
      },
    },
  },
  {
    slug: 'far-from-home',
    moduleSlug: 'peers-model',
    title: 'Far from home',
    summary: 'A first-year seems withdrawn. Practise noticing, checking in and belonging.',
    persona: { name: 'Tendai', context: 'First-year international student', tone: 'mint' },
    script: {
      start: 'notice',
      nodes: {
        notice: {
          kind: 'step',
          scene: 'You notice Tendai, a first-year, has eaten alone every day this week and barely speaks in class.',
          choices: [
            {
              text: 'Say hello and ask if you can join them for lunch.',
              quality: 'helpful',
              reaction: 'Tendai looks surprised, then smiles a little. "Sure."',
              feedback: 'Early support starts with noticing and checking in respectfully. That is the first E in PEERS.',
              next: 'open',
            },
            {
              text: 'Wait for Tendai to reach out if they need anything.',
              quality: 'okay',
              reaction: 'A few days pass. You decide to say hello after all.',
              feedback: 'Many students struggle silently. A gentle check-in can make it easier for someone to open up.',
              next: 'open',
            },
            {
              text: 'Tell a friend that Tendai seems depressed.',
              quality: 'unhelpful',
              reaction: 'Later you hear the comment has spread around the cohort.',
              feedback: 'This is diagnosing and gossip, two things that stop students seeking support. Check in with Tendai directly.',
            },
          ],
        },
        open: {
          kind: 'step',
          says: 'It’s just… everything is different here. The food, the way classes work. I miss home.',
          choices: [
            {
              text: '"That makes so much sense. Moving somewhere new is a big change. What do you miss most?"',
              quality: 'helpful',
              reaction: 'Tendai’s face softens, and they think for a moment.',
              feedback: 'Normalising the struggle and asking an open question invites them to share more.',
              next: 'belong',
            },
            {
              text: '"You’ll get used to it. Everyone does."',
              quality: 'unhelpful',
              reaction: 'Tendai nods and looks back at their plate.',
              feedback: 'True for many people, but it skips over how they feel right now. Acknowledge the change first.',
            },
            {
              text: '"Maybe you’re depressed. You should see a therapist."',
              quality: 'unhelpful',
              reaction: 'Tendai stiffens. "I’m not depressed. I just miss home."',
              feedback: 'Peer supporters do not diagnose. Missing home is a common, normal stressor; stay curious and listen.',
            },
          ],
        },
        belong: {
          kind: 'step',
          says: 'My mum, mostly. And church on Sundays. I haven’t found one here yet.',
          choices: [
            {
              text: '"Would you like to come along with me to a student community event this week? I can also ask around about churches nearby, if that would help."',
              quality: 'helpful',
              reaction: 'Tendai brightens. "That would be really nice."',
              feedback: 'Belonging is protective. Respecting what is meaningful to them, including faith, helps connect them to support.',
              next: 'end',
            },
            {
              text: '"Church won’t really help with this."',
              quality: 'unhelpful',
              reaction: 'Tendai goes quiet.',
              feedback: 'For many students, faith is the first source of support. Respect what is meaningful to them.',
            },
          ],
        },
        end: {
          kind: 'ending',
          title: 'Tendai feels a little less alone',
          text: 'You noticed someone struggling quietly, checked in with respect, and helped them find belonging. Early, relational support makes a real difference.',
          skills: ['Noticing', 'Checking in', 'Normalising', 'Belonging'],
        },
      },
    },
  },
  {
    slug: 'money-worries',
    moduleSlug: 'referral-with-care',
    title: 'Can you lend me some money?',
    summary: 'A peer under financial strain asks you for money. Practise referral with care.',
    persona: { name: 'Eric', context: 'A peer from your residence', tone: 'sunshine' },
    script: {
      start: 'ask',
      nodes: {
        ask: {
          kind: 'step',
          scene: 'Eric catches you after class, looking stressed.',
          says: 'I’m really sorry to ask… could you lend me some money? I’m behind on fees and my family is expecting me to send money home too.',
          choices: [
            {
              text: '"That sounds really stressful, trying to keep up here and support your family too. Do you want to talk about what’s going on?"',
              quality: 'helpful',
              reaction: 'Eric exhales. "Honestly, I haven’t told anyone how bad it is."',
              feedback: 'Responding to the stress behind the request first helps him feel heard, not judged.',
              next: 'story',
            },
            {
              text: 'Hand over the money straight away.',
              quality: 'okay',
              reaction: 'Eric thanks you, but you both know this will not solve the bigger problem.',
              feedback: 'Financial vulnerability is a common dilemma. It is kind, but your role is support and linking, not solving financial problems. Talk dilemmas like this through with your supervisor.',
              next: 'story',
            },
            {
              text: '"Sorry, I can’t help with that."',
              quality: 'unhelpful',
              reaction: 'Eric nods quickly and hurries off, embarrassed.',
              feedback: 'You do not have to lend money, but you can still offer support. Respond to the stress behind the request.',
            },
          ],
        },
        story: {
          kind: 'step',
          says: 'I can’t focus on anything. I feel like I’m letting everyone down.',
          choices: [
            {
              text: '"It makes sense you’d feel that way with so much pressure. The Financial Aid Office helps with situations like this. Would you like to go together?"',
              quality: 'helpful',
              reaction: 'Eric looks relieved. "I didn’t know that was an option. Yes, please."',
              feedback: 'Referral with care: you connected him to the right service and offered to walk with him.',
              next: 'follow',
            },
            {
              text: '"Just ask your family for more time."',
              quality: 'unhelpful',
              reaction: 'Eric shakes his head. "You don’t understand."',
              feedback: 'Quick fixes can feel dismissive, especially with family expectations involved. Listen, then link to a service that can help.',
            },
          ],
        },
        follow: {
          kind: 'step',
          scene: 'A few days after visiting the Financial Aid Office together…',
          choices: [
            {
              text: 'Send Eric a short message: "Hope the follow-up went okay. Here if you want to talk."',
              quality: 'helpful',
              reaction: 'Eric replies: "Thanks. It’s getting sorted. Means a lot that you asked."',
              feedback: 'Staying connected appropriately after a referral shows care continues.',
              next: 'end',
            },
            {
              text: 'Ask Eric for every detail of his finances to make sure it’s sorted.',
              quality: 'unhelpful',
              reaction: 'Eric seems uncomfortable and gives short answers.',
              feedback: 'Checking in should respect privacy. Offer support without pressing for details.',
            },
          ],
        },
        end: {
          kind: 'ending',
          title: 'Eric got the right support',
          text: 'You responded to the stress behind the request, linked Eric to the right service, and stayed connected. You supported him without trying to carry the problem alone.',
          skills: ['Listening', 'Referral with care', 'Common dilemmas', 'Following up'],
        },
      },
    },
  },
];
