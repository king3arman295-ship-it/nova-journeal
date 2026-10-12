// Starter articles. Content format: blank line = new paragraph,
// "## " = heading, "> " = quote, ``` fences = code block.
module.exports = [
  {
    title: 'Prompting is becoming interface design',
    category: 'AI', art: 'art-a', author: 'Mira Okafor', daysAgo: 2,
    excerpt: 'The best prompts now look less like commands and more like layouts. Here is what that shift means for people who build products.',
    content: `A year ago, a good prompt was a clever sentence. Today it is closer to a page layout: sections, constraints, examples and a clear idea of who is reading the result. The skill is moving from wordsmithing toward design.

## From commands to layouts

Early prompts were short commands: summarize this, translate that. Modern systems handle long, structured instructions, so the interesting work happens in how you arrange them. Role, context, task and format each get their own place, the same way a good screen separates navigation from content.

> A prompt is a screen the model reads. Design it for the reader.

## Structure beats length

Adding more words rarely helps. Adding clearer boundaries almost always does. Group related instructions, label your examples, and say plainly what a finished answer looks like.

\`\`\`
Role:    You are a careful technical editor.
Context: The reader is a beginner.
Task:    Rewrite the paragraph below in plain language.
Format:  Three short sentences, no jargon.
\`\`\`

## Testing like a designer

Designers test with real people and real tasks. Prompt authors can do the same: collect ten awkward inputs, run them all, and look for patterns in what breaks. Change one thing at a time, and keep notes on what moved.

## What comes next

As models get better at following structure, the interface between people and software will look less like menus and more like conversations with clear rules. The people who thrive will be the ones who can describe what they want precisely, and that has always been a design skill.`
  },
  {
    title: 'What a ten-year battery actually changes',
    category: 'Hardware', art: 'art-b', author: 'Jonas Weber', daysAgo: 8,
    excerpt: 'When a device outlives its warranty, the whole product relationship flips. Repair, resale and design all follow.',
    content: `Most gadgets die when their battery does. Remove that failure point and a phone, a watch or a sensor can stay useful for a decade. That sounds like a small change, but it rewrites how products are made and sold.

## Repair becomes the default

If the battery lasts, the next thing to fail is a screen, a port or a speaker. Companies that expected people to upgrade every two years suddenly need spare parts, manuals and a plan for year eight.

## Resale gets real

A device with a healthy battery holds its value. Second-hand markets grow, and the first owner effectively rents the product rather than owning it to the end of its life.

> The longest-lasting product is the one nobody has a reason to replace.

## Design gets quieter

Without a battery swap to plan for, designers can seal devices more tightly and make them thinner, or they can choose repairable layouts on purpose. Both are now real options.`
  },
  {
    title: 'Orbital data centers: hype or hardware?',
    category: 'Space', art: 'art-d', author: 'Priya Nair', daysAgo: 16,
    excerpt: 'Cooling is free in the vacuum, until you remember there is no air to carry the heat away. We run the numbers.',
    content: `The pitch is simple: put servers in orbit, power them with constant sunlight, and let space do the cooling. Each of those three claims is partly true and partly misleading.

## Power is the easy part

A satellite in the right orbit sees the sun for most of every day. Solar panels work well there, and the energy is plentiful, though launching the panels is not cheap.

## Cooling is the hard part

Space is cold, but a vacuum is also an excellent insulator. Heat can only leave by radiation, which means large radiator panels. The more computing you pack in, the bigger the radiators must be.

> In space nobody can hear your fans, because fans do not work.

## Where it could make sense

Processing data where it is collected, such as satellite imagery, saves sending raw files back to Earth. Small orbital compute makes sense there. Replacing a ground data center does not, at least not yet.`
  },
  {
    title: 'Walking through a city built for sensors',
    category: 'Cities', art: 'art-e', author: 'Priya Nair', daysAgo: 25,
    excerpt: 'A week in a district where every lamp post listens. What it gets right, and what it quietly gives up.',
    content: `The district looks ordinary from the street. The difference is overhead: lamp posts, crossings and bins all carry small sensors that count people, measure air and listen for traffic.

## What it gets right

Crossings adapt to how many people are waiting. Air quality alerts reach residents within minutes. Street lights dim when nobody is around and save a surprising amount of power.

## What it quietly gives up

Anonymous counting is easy to promise and hard to prove. Residents we spoke to were comfortable with the air sensors and uneasy about anything that could track a route.

> A smart city earns trust by publishing what it collects, not by promising it collects nothing.

## What we would ask for

Plain-language maps of every sensor, a short list of what each one records, and a public way to challenge any of them.`
  },
  {
    title: 'The case for slower interfaces',
    category: 'Design', art: 'art-c', author: 'Mira Okafor', daysAgo: 34,
    excerpt: 'Instant is not always better. A few well-placed seconds can make software feel more trustworthy.',
    content: `We spend years making software faster, then add a loading animation to a bank transfer because it feels wrong when it finishes instantly. Speed is not the same as confidence.

## Pauses that help

A short pause after a big action tells people the system took it seriously. A confirmation that appears after a beat feels deliberate, while one that flashes by feels like a glitch.

## Pauses that hurt

Delays should never hide real work or block someone who is in a hurry. If a person has to wait, they should know why and how long.

> Slow on purpose is design. Slow by accident is a bug.

## A simple rule

Keep everyday actions instant, and give weight to the few actions that cannot be undone.`
  },
  {
    title: 'Notes on running models at home',
    category: 'AI', art: 'art-f', author: 'Jonas Weber', daysAgo: 43,
    excerpt: 'A practical tour of local models: what fits on a single GPU, what does not, and why you might still want it.',
    content: `Running an AI model on your own machine used to be a hobby for people with server racks. Today a single consumer graphics card can run models that are useful for writing, coding and image work.

## What fits where

Memory is the limit. A model must fit in graphics memory, plus room for the conversation it is working on. Smaller, compressed versions of larger models are the usual way to make things fit.

## Why bother

Privacy is the obvious reason, because nothing leaves your machine. Cost and control matter too: no per-request fees, no sudden changes, and the freedom to tune a model to your own work.

> Local models are not always better. They are always yours.

## Getting started

Pick one task you do often, try a small model on it, and measure whether the result is good enough. Add hardware only after you know what you need.`
  }
];
