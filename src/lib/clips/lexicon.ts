export const STOPWORDS = new Set(
  `a an the and or but so if then than that this these those there here is are was were be been being am
  i me my mine we us our you your yours he him his she her it its they them their what which who whom
  to of in on at by for with about as into like through over after before from up down out off again
  just also very really too not no yes do does did doing have has had having will would can could should
  shall may might must get got gonna wanna kind sort thing things stuff one two all any some more most
  oh um uh ah yeah okay ok right well know mean think going go went come came say said see saw make made
  let lets how why when where because while now even still much many own same other such only`.split(/\s+/),
);

export const FILLERS = new Set(["um", "uh", "erm", "er", "ah", "hmm", "mm", "uhm", "umm", "uhh"]);

export const HOOK_PHRASES = [
  "wait",
  "no way",
  "watch this",
  "look at this",
  "listen",
  "here's the thing",
  "the truth is",
  "nobody",
  "never",
  "secret",
  "biggest",
  "worst",
  "best",
  "mistake",
  "stop",
  "imagine",
  "what if",
  "did you know",
  "you won't believe",
  "how to",
  "why",
  "the reason",
  "i can't believe",
  "hot take",
  "unpopular opinion",
];

export const EMOTION: Record<string, number> = {
  amazing: 1, insane: 1, crazy: 1, incredible: 1, unbelievable: 1, love: 0.8, hate: 0.9, angry: 0.9,
  scared: 0.9, terrified: 1, shocked: 1, shocking: 1, wow: 0.9, omg: 1, awesome: 0.8, terrible: 0.9,
  horrible: 0.9, disgusting: 0.9, beautiful: 0.7, hilarious: 1, funny: 0.7, sad: 0.8, cried: 0.9,
  crying: 0.9, furious: 1, excited: 0.8, obsessed: 0.9, wild: 0.8, epic: 0.9, legendary: 0.9, huge: 0.6,
  massive: 0.7, brutal: 0.9, ridiculous: 0.8, perfect: 0.6, disaster: 0.9, nightmare: 0.9, dead: 0.6,
  died: 0.7, killed: 0.7, fire: 0.6, lit: 0.6, broke: 0.6, rich: 0.6, million: 0.7, billion: 0.8,
  never: 0.4, always: 0.3, worst: 0.8, best: 0.6, literally: 0.4, honestly: 0.4, seriously: 0.5,
  damn: 0.7, hell: 0.6, yes: 0.3, no: 0.2, what: 0.2, lol: 0.8, haha: 0.9, hahaha: 1, laugh: 0.7,
  laughing: 0.8, screaming: 1, panic: 0.9, win: 0.6, won: 0.6, lost: 0.6, lose: 0.5, fail: 0.7,
  failed: 0.7, clutch: 0.9, insanely: 1, genius: 0.8, stupid: 0.8, dumb: 0.7, weird: 0.6, strange: 0.5,
};

export const LAUGH = /\b(ha(ha)+|lol|lmao|\[laugh(ter|s)?\]|\(laugh(ter|s)?\))\b/i;

export const DANGLING_START = new Set([
  "and", "but", "so", "or", "because", "then", "also", "which", "he", "she", "it", "they", "him",
  "her", "them", "that", "this", "these", "those", "there", "anyway", "like",
]);

export const NUMBER_WORDS = /\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten|hundred|thousand|million|billion|first|second|third|percent)\b/i;

export const EMOJI: [RegExp, string][] = [
  [/^(money|cash|dollars?|paid|rich|million|billion|\$\d+)/i, "💰"],
  [/^(fire|lit|hot|burn)/i, "🔥"],
  [/^(love|loved|heart)/i, "❤️"],
  [/^(ha(ha)+|lol|lmao|funny|hilarious|laugh)/i, "😂"],
  [/^(crazy|insane|mind|wild|unbelievable|shocked?)/i, "🤯"],
  [/^(win|won|winner|champion|victory|clutch)/i, "🏆"],
  [/^(time|minutes?|hours?|seconds?|clock)/i, "⏰"],
  [/^(idea|think|smart|genius|brain)/i, "💡"],
  [/^(dead|died|kill|killed|rip)/i, "💀"],
  [/^(game|gaming|play|played)/i, "🎮"],
  [/^(eat|food|hungry|pizza|cook)/i, "🍕"],
  [/^(scared|scary|afraid|terrified)/i, "😱"],
  [/^(goal|target|aim)/i, "🎯"],
  [/^(rocket|launch|grow|growth|fast)/i, "🚀"],
];

export const PROFANITY = new Set([
  "fuck", "fucking", "fucked", "fucker", "shit", "shitty", "bullshit", "bitch", "bitches", "asshole",
  "bastard", "dick", "cunt", "motherfucker", "piss", "pissed", "crap", "damn", "goddamn", "slut", "whore",
]);
