---
date: '2025-07-19T17:04:00.000Z'
description: "Here's how it went"
image: ipad-header.jpeg
slug: tried-ipad-as-development-machine
tags:
- Development
- iPad
- VSCode
- GitHub Codespaces
categories:
- iPad
title: "I tried the iPad as a development machine. Here's how that went"
---

Earlier this year, my gaming laptop started to show its signs of aging. Games constantly froze, laptop kept getting hotter on idle use and graphics and animations were slower than ever before. Thus I had decided to build a gaming PC for myself.

But I still needed a laptop for when I'd be traveling. Most of the latest laptops available in the Indian market were that of Intel. Given the spate of issues that have hit Intel chips in the last few years, I did not want to go for them. The ones having the AMD chip were all gaming laptops and were too expensive. Snapdragon X based laptops are not quite ready yet for the full development lifecycle.

I then realized I could do all of my development online. Which then drove me to the iPad. The iPad Air with the M3 chip and 256GB storage was available at Rs. 80k and was far cheaper than the other laptops I'd been looking at. The iPad combined with a Magic Keyboard was all that I needed to properly code on the go.

## My Coding Combination

**GitHub Codespaces** became my primary development environment. The biggest gotcha? iPadOS keyboard shortcuts. They're locked down tighter than a production database, so the usual Cmd+T for new tabs simply opens a new Safari tab instead of a terminal tab in VS Code.

My workaround: Open the codespace, then "Add to Home Screen" via Safari's share menu. This creates a pseudo-native PWA app that bypasses some shortcut restrictions. You can finally remap Option-based shortcuts to something sensible like Option+W for closing tabs and Option+Tab for switching between them.

The muscle memory adjustment took about two weeks, but now I'm flying through code again.

**Beyond the basic setup**, I'm running a 2-core, 8GB RAM codespace instance that costs roughly $0.36/hour. For most days, the free 120 hours covers everything, but intense project weeks can push me into paid territory.

## What Nobody Tells You About iPad Development

### The good stuff that surprised me

The M3 chip is genuinely overkill for development work. I can have 20+ Safari tabs open, multiple codespace instances, Slack, Figma, and a Zoom call running simultaneously without any thermal throttling. My old Intel laptop would have sounded like a jet engine by now.

Battery life is incredible. I coded for 6 hours straight during a recent flight to north India, watched a web series episode, and still had 20% charge left. Try that with any x86 laptop under Rs. 1.5 lakhs.

### The painful realities

Internet dependency is brutal. During a power outage that killed my Wi-Fi for 3 hours, the iPad became an expensive paperweight. No local Node.js, no Git, no nothing. Laptops with local dev environments would have kept me productive. I then had to rely on the hotspot from my iPhone, but that ended up draining the battery of both the devices.

File management feels terrible. Want to drag a CSV from Files into your web app for testing? Prepare for a 5-step dance involving the share sheet, temporary storage, and prayer. The Files app is a beautiful lie that promises desktop-like file handling but delivers mobile-first friction. However things might change with the upcoming iPadOS 26 release.

### Real Performance Testing

I stress-tested this setup during a weekend trying to do multiple things:

- Migrate this blog from Hashnode to Hugo
- Learn about LLMs by building an app
- Build a webserver in Go from scratch

All of the above were on three different codespaces on GitHub. Here's what came out of that weekend:

- Day 1: Smooth sailing. Hot reloading worked perfectly on Hugo, additional go module installs were fast thanks to codespace's fiber connection, and the iPad stayed cool despite 12 hours of continuous use.
- Day 2: Discovered the multi-tasking limitations. Switching between the codespaces, go documentation, and Discord required constant app switching. Unlike Windows or Mac, the switching between app animations takes ~2 seconds to complete. This definitely frustrated me.

## Cost Reality Check

My iPad Air M3 (256GB) set me back ₹80,000 and the Magic Keyboard cost another ₹27,000, totalling ₹1,07,000. Compare this to a MacBook Air M3 at ₹1,15,000 or a decent Windows laptop at ₹80,000-1,20,000. Unfortunately the iPad falls flat in front of the MacBook Air thanks to its positioning in premium pricing territory while delivering close to no benefits over the MacBook.

## When iPad Development Actually Makes Sense

You're a good candidate if you satisfy some of these below points:

- Your codebase lives in GitHub with proper CI/CD setup through GitHub Actions
- You primarily work with web technologies (React, Vue, Node.js, Python web apps)
- You have reliable high-speed internet everywhere you code
- You value portability over raw performance
- You're comfortable with cloud-first workflows

If that doesn't sound like you, then you should stick to a laptop if:

- You do native iOS/Android development (yes, the irony)
- Your workflow involves Docker, VMs, or local databases
- You frequently work offline or with spotty internet
- You need multiple monitors for productivity
- You rely heavily on platform-specific tools

## Three months later: The honest verdict

This experiment succeeded, but with important caveats. The iPad handles 80% of my development tasks beautifully. The remaining 20% – complex debugging, performance profiling, multi-service local development – still sends me back to my desktop.

**What I miss most**: Terminal muscle memory. Web-based terminals are good, but they're not *native*. Keyboard shortcuts feel slightly off, copy-paste behavior is inconsistent, and there's always a tiny input lag that breaks flow state.

**What I appreciate most**: Zero thermal throttling, all-day battery, and the ability to code comfortably in coffee shops without looking like I'm running a crypto mining operation.

The iPad won't replace serious development machines yet, but it's redefined what "portable coding" means for me. When Apple inevitably allows proper terminal emulators and fixes the multitasking limitations, this setup will become genuinely compelling for a broader range of developers.

## The Bottom Line

If you're expecting a laptop replacement, you'll be disappointed. If you're looking for a capable secondary development device that happens to be the best tablet on the market, the iPad delivers.

The future of development is increasingly cloud-native, and the iPad offers a glimpse into that future today. It's not perfect, but it's far more capable than I expected when I started this experiment.

Would I buy it again? Absolutely. But I'd also keep a proper development machine for the heavy lifting.