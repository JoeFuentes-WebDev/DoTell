# AmGoing — UX Documentation
Extracted from Wireframes v1.0 · June 8, 2026
For use as Scaffold clarification input

---

## 1. App Identity

- **App name:** AmGoing
- **Tone:** Calm, social, local. Not a social network — a presence layer over real-world activity.
- **Primary action vocabulary:** Interested / Am Going / Less like this / Here Now / HereToo
- **Visual direction:** Light, minimal. White cards on light gray background. System font. Emoji as category icons. No heavy chrome.

---

## 2. Primary Screen — Feed

### Layout
- Header: App name "AmGoing" (left) + three icons: Add (⊕), Notifications (🔔), Profile (◯)
- Date/Location bar: Two pills — "When" (date) + "Where" (neighborhood). Tappable to change.
- Feed: Vertical list of event cards, grouped by date. Future dates collapsed with count (e.g. "14 events ▾").

### Event Card — Collapsed
- Category emoji icon (🎷 🏛 😂 🎾)
- Venue name + street address
- Time + event description (one line)
- Three actions: [ Interested ] [ Am Going ] [ Less like this ]

### Event Card — Expanded (tap to expand)
- Same header
- Partner badge if applicable: "✓ AmGoing Partner"
- Distance: "📍 0.25 mi"
- Hours: "🕐 Open until 2am"
- Web + Map icons
- Description paragraph (2-3 sentences)
- Social count: "12 interested · 3 going · 2 here"
- Same three action buttons

### Momentum Overlay (tap social count)
- Slides up from bottom over the feed
- Shows list of people going: avatar initial + name + optional note
- Anonymous users show as "?" with "Anonymous" label
- Close with ✕

---

## 3. HereToo Banner

- Appears at top of feed when a connected person is at the same venue
- Shows: "[Name] is HereToo at [Venue] ↗"
- Inline text field: "...send an update" → posts a note visible to others at the venue
- Dismissible with ✕
- When user has posted: shows their note + others' notes inline below the banner (Here Now section)
- Notes show avatar initial + name + quoted text

---

## 4. Note Composer Overlay

Triggered after tapping "Am Going" or "Here Now":

**Am Going note:**
- Header: "Add a note" + subtitle "Optional · helps others find you"
- Shows the event context (venue + time)
- Single text field, 80 char max, placeholder "0 / 80"
- Two CTAs: [ Post note ] [ Skip ]

**Here Now note:**
- Header: "You're here!" + subtitle "Let others know where to find you"
- Same layout as Am Going note
- Same 80 char limit

**Committed + Edit:**
- Feed card shows "✓ Am Going ✏" — checkmark confirms commitment, pencil reopens note composer

---

## 5. Notification Center

- Accessed via 🔔 icon in header
- Header: "Notifications" + "Clear all" (right)
- Grouped by date ("Today")
- Each notification: avatar initial + name + action + event context + optional note in quotes + timestamp
- Action types: "is HereToo", "is going", "is interested"

---

## 6. Settings

- Profile: avatar + name + "Change photo"
- **Observed interests:** "Inferred from your activity. Read only." — list of auto-detected tags (Jazz, Wine, Museums, Pickleball)
- **Declared interests:** "Tell the agent what to look for." — editable list + Add button (Hiking, Photography)
- **Visibility toggles:**
  - Show my name (Named, not anonymous)
  - Show places I've been (HereToo)
  - Enable HereToo
  - Show me as Here Now
- **Notifications:** Momentum alerts, HereToo alerts
- **Privacy:** Block / Mute
- **Roadmap** link

---

## 7. Onboarding Carousel (5 slides, skip available on all)

| Slide | Icon | Headline | Body |
|-------|------|----------|------|
| 1 | 📍 | Your city is full of things to do. | Concerts, museums, hikes, wine tastings. AmGoing finds what's happening near you and surfaces what's worth showing up for. |
| 2 | ✨ | Your feed learns you. | Every tap, every event you attend, every category you dismiss teaches AmGoing what matters to you. No forms. Just use it. |
| 3 | 👥 | See who's going. | Social momentum turns a listing into something worth showing up for. When real people are going, you'll know. |
| 4 | 🔔 | HereToo. | When someone you've opted into arrives at the same place, AmGoing lets you know. A quiet nudge that you're not alone. |
| 5 | 🎛 | What are you into? | Interest selection grid. Tags: Jazz, Wine, Museums, Hiking, Comedy, Photography, Pickleball, Theater, Food Festivals, Live Music, Art, Film. CTA: "Get started →" |

---

## 8. Empty States

**Loading:**
- Icon: 🗺️
- Headline: "Building your feed..."
- Body: "Our AI is out exploring Hayes Valley. Give it a sec."
- Info icon (ℹ)

**No Events:**
- Headline: "Not much happening today."
- Body: "Even the tumbleweeds took the night off. Check back tomorrow or try a different date."
- Icon: 🌵 (contextual — changes by location)

---

## 9. Key UX Decisions (for Scaffold clarification input)

**Interaction model:**
Three-state commitment per event: Interested (soft signal) → Am Going (committed) → Here Now (arrived). Each state transition is a single tap. State is visible to others via social counts and notifications.

**Social layer:**
Anonymous by default. Users can opt into named visibility per event. The momentum overlay shows real names only for users who have opted in — others show as anonymous. This is the privacy-first social model.

**HereToo:**
Opt-in presence sharing. Only triggers between mutually opted-in users. Not broadcast — targeted. The banner is ambient, not a push notification inside the app.

**Note composer:**
Always optional, always skippable. 80 char hard limit. Purpose is wayfinding ("I'm at the bar") not social posting. Notes are ephemeral — visible while at the venue, not persisted as a social feed.

**Feed structure:**
Date-grouped, location-filtered, collapsed for future dates. The "Where" pill is the primary filter — neighborhood-level, not city-level. Events are ranked by relevance + momentum, not chronologically.

**Interest model:**
Two-tier: Declared (user-set, explicit) + Observed (inferred from behavior, read-only). The agent uses both. User can add declared interests but cannot edit observed ones.

**Navigation:**
No bottom tab bar in wireframes. Single-screen app with overlays and banners. The feed IS the app — settings, notifications, and profile are accessed via header icons.

**Onboarding:**
5-slide carousel, all skippable. Interest selection on slide 5 is the only data collection step before getting to the feed. No account creation shown — anonymous-first implied.
