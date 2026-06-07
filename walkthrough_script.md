# CrustIntel — Walkthrough Video Script
### Target length: 3-4 minutes | Tone: conversational, technical, relaxed (speaking naturally, like a developer demoing to a founder)

---

## SECTION 1 — Introducing CrustIntel (0:00–0:40)

**[Screen: Show the CrustIntel dashboard in Demo Mode]**

"Hey everyone. Today I'm demoing CrustIntel—a real-time competitive intelligence war room built entirely on top of Crustdata and Claude. 

The concept is simple: we ingest live market signals from the Crustdata APIs, use Claude to reason about those signals, and present everything in this unified dashboard.

You'll notice the badge at the top says 'Demo Mode.' Out of the box, the app runs on rich local mock data so anyone can explore the features instantly. Let's do a quick run-through of the interface, and then I'll connect my live Crustdata API key to show you real-time enrichment."

---

## SECTION 2 — Dashboard Walkthrough (0:40–1:45)

**[Screen: Point to the Metrics Bar, then hover over the Market Map, then scroll down to the Signal Feed]**

"First, the Metrics Bar at the top. This gives you a high-level pulse of the market: how many companies you're tracking, total signals, this week's activity, and a color-coded overall threat index. These animate in when you load the page and update dynamically as new data arrives.

In the center is our Orbital Market Map. We're tracking Crustdata here, so it sits right in the middle. All its competitors are arranged in orbits based on how big of a threat they are. Inner orbit is high threat—companies like Apollo and ZoomInfo. Outer orbit has adjacent players like Clay. It's fully interactive—you can pan, zoom, and click any node to pull up details.

Below the map, we have the live Signal Feed. This is a real-time event stream showing hiring surges, executive moves, and product launches. You can filter them quickly using these chips—All, Hiring, Exec, Product, or Talent. 

For example, clicking 'Talent' immediately filters to show senior movements—like three ex-Crustdata engineers moving to Apollo. If we click any card, it takes us straight into that company's profile."

---

## SECTION 3 — Intelligence Briefs & Talent Flow (1:45–2:30)

**[Screen: Focus on the right sidebar panels]**

"On the right sidebar, we have our analytical panels. 

The top one is the Intelligence Brief. This is a weekly or monthly summary. It highlights the overall threat score and writes a concise executive summary. For instance, it points out Apollo's new agent SDK as a direct threat, and ZoomInfo's executive departures as a hiring opportunity. It also lists key risks and recommended actions. We can toggle between weekly and monthly reports using these navigation dots.

Below that is the Talent Flow panel. This tracks team migrations between competitors. Red arrows indicate talent leaving, green arrows show people joining. 

There's also an 'Analyze' button next to each flow. In demo mode, it shows a mock breakdown, but when API keys are active, this launches a live Claude agentic lookup to find who moved and assess the strategic risk."

---

## SECTION 4 — The Company Modal (2:30–3:15)

**[Screen: Click 'Apollo.io' on the map to open the Company modal]**

"Let's click Apollo.io on the map to open the company modal. 

Here we see their core profile: headcount, funding stage, estimated revenue, and their active tech stack. 

At the bottom is a 'Generate Strategic SWOT' button. In demo mode, clicking this immediately pulls up a cached SWOT analysis, a moat assessment, and an autonomous playbook of recommended moves. 

But now, let's see what happens when we switch to Live Mode."

---

## SECTION 5 — Live Mode & Quota Handling (3:15–4:15)

**[Screen: Open Settings (⚙), paste the Crustdata API key, click Save, watch the badge flip. Open Search and look up 'Bolna.ai']**

"Let's open Settings and paste in my Crustdata API key. 

Once saved, notice the header badge flips to 'Crustdata Active'. Now the app is communicating with the live API. 

If we re-open Apollo.io, a green 'Live Crustdata' badge appears. This headcount number just came from a real-time API call.

But we aren't restricted to our mock list. Let's open the search bar using Ctrl+K and search for 'Bolna.ai'—a startup completely absent from our mock database. The app shows no local matches, but gives us a 'Search Live Crustdata' button. 

When I click it, the app calls our `/api/company` route, queries the live Crustdata API, parses their headcount range, and dynamically imports their profile in real-time. 

Also, if your API key runs out of quota or hits limits, the app handles it gracefully—showing a clear 'Quota Exceeded' or 'Payment Required' error next to the status code instead of failing silently."

---

## SECTION 6 — The Agentic Loop & Wrap-up (4:15–5:00)

**[Screen: Explain the Claude key flow and wrap up]**

"The final piece is connecting your Claude key. Adding it activates the full agentic loop. 

When both keys are set, clicking 'Generate SWOT' or 'Analyze Talent Flow' runs a live loop in `lib/ai.js`. Claude acts as an autonomous agent—deciding which Crustdata endpoints to query, retrieving headcount, jobs, or executive details in sequence, and generating real-time strategic intelligence.

This isn't just a static template; the AI is deciding what data to fetch to build your playbook. 

It takes less than two minutes to get running. The setup guide is in the GitHub description. Check it out, and thanks for watching!"
