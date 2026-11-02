// Daily stories: short, illustrative accounts of peer support making a
// difference. They are composites of common situations from peer support
// training, not real people, and the app labels them that way. Each one links
// to the module whose ideas it shows in action. Bodies use the lesson markup.
import type { StoryContent } from './types';

const blocks = (...b: string[]) => b.join('\n\n');

export const stories: StoryContent[] = [
  {
    slug: 'the-quiet-seat',
    title: 'The quiet seat at lunch',
    moduleSlug: 'mental-health-101',
    body: blocks(
      'Amani noticed that a classmate who used to fill the lunch table with jokes had started eating alone, earbuds in, leaving early.',
      'She did not make a big announcement. She sat nearby for a few days, then one afternoon said: "I’ve missed your jokes at lunch. How are you really doing?"',
      'He laughed it off at first. Two days later he messaged her: the move to Kigali had been harder than he let on. They talked, and she mentioned the Wellness team was easy to talk to. He booked a chat that week.',
      '> Remember: Many struggles stay **hidden behind a smile**. A gentle, private check-in can be the first door someone walks through.',
    ),
    reflection: 'Who in your circle has gone a little quiet lately? What would a low-pressure check-in sound like from you?',
  },
  {
    slug: 'just-listening',
    title: 'When listening was enough',
    moduleSlug: 'psychological-first-aid',
    body: blocks(
      'Kezia came to her peer supporter, Daniel, after failing a test she had studied hard for. Daniel felt the urge to jump in with study tips.',
      'Instead he put his phone away, faced her, and let the silences be. When she finished, he said: "That sounds really discouraging, especially after all that work."',
      'Later Kezia told him that nobody had given her advice she could not already guess, but nobody had simply listened either. That was what helped.',
      '> Remember: Be **alongside, not above**. Presence often matters more than advice.',
    ),
    reflection: 'Think of a time someone really listened to you. What did they do that made you feel heard?',
  },
  {
    slug: 'walking-together',
    title: 'Walking to the Wellness office together',
    moduleSlug: 'referral-with-care',
    body: blocks(
      'For weeks, Aline had been supporting a friend whose low mood was not lifting. He had stopped going to classes. Aline felt out of her depth.',
      'She told him honestly: "I want to help, but I think we need more support than just me." He was nervous, so she offered to walk with him to the Wellness office.',
      'She waited outside while he went in. Afterwards they got tea. She kept checking in over the next weeks, and he slowly came back to class.',
      '> Remember: Referral **adds** support. It does not remove relationship.',
    ),
    reflection: 'What would make it easier for someone you support to accept more help?',
  },
  {
    slug: 'the-promise-not-made',
    title: 'The promise she did not make',
    moduleSlug: 'boundaries-confidentiality',
    body: blocks(
      'A peer asked Grace to swear she would never tell anyone what he was about to say. Grace felt torn: she wanted him to trust her.',
      'She said: "What you tell me stays between us, unless I’m worried about your safety. If that happens, I’d involve the Wellness Center, and I’d tell you first."',
      'He paused, then shared anyway. Because she had been honest from the start, he trusted her more, not less, when she later helped him reach professional support.',
      '> Remember: Explain the **limits of confidentiality** at the start, so there are no surprises later.',
    ),
    reflection: 'How would you explain the limits of confidentiality in your own words?',
  },
  {
    slug: 'permission-to-rest',
    title: 'Permission to rest',
    moduleSlug: 'caring-for-yourself',
    body: blocks(
      'Eric was the peer everyone messaged. He answered at midnight, between classes, during meals. His grades started slipping and he felt guilty whenever he rested.',
      'At a team meeting he finally said: "This is more than I can handle alone." His supervisor helped him share the load and set reply hours.',
      'A month later he was sleeping again, and his support was calmer and kinder, because he was no longer running on empty.',
      '> Remember: Protecting yourself **is part of** peer support. You have permission to pause.',
    ),
    reflection: 'What is one small thing you could do this week to protect your own energy?',
  },
  {
    slug: 'first-door',
    title: 'The first door',
    moduleSlug: 'peers-model',
    body: blocks(
      'When Ishimwe’s family faced money troubles back home, she did not go to an office. She went to her roommate, the person she already trusted.',
      'Her roommate, a peer supporter, listened, helped her feel less alone, and later sat with her while she emailed the Financial Aid Office.',
      'Ishimwe still says the help started not with a form, but with one friend who stayed with her.',
      '> Remember: As a peer, you are often the **first door** someone knocks on, and you never have to be the only one.',
    ),
    reflection: 'Why do you think students often go to friends before professionals?',
  },
  {
    slug: 'breathing-together',
    title: 'Breathing together before the presentation',
    moduleSlug: 'psychological-first-aid',
    body: blocks(
      'Minutes before a group presentation, Fiston found a teammate shaking in the corridor, breathing fast.',
      'He crouched to her eye level, kept his voice calm and soft, and said: "I’m here. Let’s breathe slowly together." He counted out loud, and she followed his pace.',
      'After a few minutes she felt steadier. She presented, and afterwards asked him how he knew what to do. "Training," he smiled.',
      '> Remember: A **calm, soft voice** and **slow breathing** help someone settle.',
    ),
    reflection: 'What helps you calm down when you feel overwhelmed? Could it help someone else?',
  },
  {
    slug: 'widening-the-circle',
    title: 'Widening the circle',
    moduleSlug: 'boundaries-confidentiality',
    body: blocks(
      'A first-year student began relying on Olivier for everything, texting late every night and saying he was the only one who understood.',
      'Olivier talked it through with his supervisor. Together they helped the student join a study group and meet a faith community she had mentioned missing.',
      'Months later she had several people to lean on, and she thanked Olivier for not letting her lean only on him.',
      '> Remember: Healthy boundaries keep support **safe and sustainable**, for them and for you.',
    ),
    reflection: 'Who else is in the support circle of the people you help? How could you help that circle grow?',
  },
  {
    slug: 'small-steps',
    title: 'Success looked small',
    moduleSlug: 'peers-model',
    body: blocks(
      'Diane had hoped to "fix" a friend’s homesickness. After a long talk, nothing seemed solved, and she felt she had failed.',
      'A week later the friend said: "I called my mum, and I joined the cooking club. Talking to you made me feel less alone."',
      'Diane realised success had happened. It was just smaller and quieter than she expected.',
      '> Remember: Success is often small: someone who feels **heard, less alone**, and takes one positive step.',
    ),
    reflection: 'What small sign of progress have you seen in someone recently?',
  },
  {
    slug: 'noticing-early',
    title: 'Noticing early',
    moduleSlug: 'mental-health-101',
    body: blocks(
      'During exam season, Patrick noticed his friend was irritable, procrastinating and sleeping badly, but still getting by.',
      'Rather than wait, he suggested study breaks together and checked in each evening. When the stress kept building, they talked about visiting the Wellness team, and his friend went before things got worse.',
      'Looking back, his friend said those early check-ins stopped a hard week turning into a hard term.',
      '> Remember: Stress is **cumulative**, and **early support prevents crisis**.',
    ),
    reflection: 'What early signs of stress do you notice in yourself or others around exams?',
  },
];
