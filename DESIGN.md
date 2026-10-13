# OpenJM native design

The approved OpenJM identity is Calm Intelligence: readable dark working surfaces, content first, meaningful green actions and recognizable hummingbird branding. Adapt the interaction to the OS while keeping that identity.

## Tokens

Canvas `#080B0A`, panel `#151A19`, elevated `#1A2226`, field `#1B2023`, primary text `#F2F4F3`, secondary text `#A9B5AF`, muted text `#84928B`, brand green `#52B583`, action mint `#19D18C`, pressed mint `#19B87C`, danger `#F05257`, warning `#F0BE48`. Mint-filled controls use canvas foreground. Selection also has a checkmark or explicit accessibility state. Spacing uses 4, 8, 12, 16, 24, 32; controls use an 8-unit radius and working panels 16.

Use the approved bundled Roboto assets for app text, mapped to body, control, metadata and title roles with font scaling enabled. Body is 17 on iOS and 16 on Android. Compact working headings are 20–24; controls 16; metadata 13. System dialogs and pickers retain their OS typography. Font loading failure falls back to the system font and never blocks entry. No fixed-height text containers, capped font scaling or truncation of critical feedback. Long response text is selectable.

## Navigation and behavior

A branded mobile header has the profile mark on the left, approved OpenJM wordmark centered and a menu control on the right, matching the inspected web mobile Navbar. A dismissible drawer exposes history/new chat/apps/profile/configuration/legal; groups/jobs/embeddings/completion alerts remain secondary destinations. Back closes an open drawer before leaving its native stack. Dismissal restores focus to the opening control. There is no visible global tab bar. Account and configuration use grouped settings lists, preserving the web hierarchy. Authenticated default entry is history; authorized deep links and account-scoped restoration take precedence.

Use native navigation stacks and self-contained sheets for short tasks. Preserve iOS edge swipe and Android system Back. Forms scroll inside safe areas and above the keyboard. Minimum controls are 48 units on Android and 44 on iOS. Large text may increase control height. Accumulating history/activity uses virtualized lists. Compact search/filter controls and date-grouped history follow the mobile web composition; native adaptations expand targets and reflow text rather than reproduce web clipping.

The conversation composer remains reachable with a visible keyboard; history and responses scroll natively. Loading, offline, pending and failure states remain explicit. Failed requests retain input and offer an intentional retry. Immediate state changes are the default; native transitions honor reduced motion. Permission prompts follow a user action and explain its benefit.

Native screen verification requires installed-app capture on each OS. An Expo browser preview is only a bundle/interaction aid and cannot approve platform layout or lifecycle.

## Artwork and motion

Use current inspected mobile-web surfaces, approved logos/mobile artwork and recognizable motion as references. Record source hashes and deliberate OS adaptations. The hummingbird uses offline-rendered transparent frames from the approved model and native transforms; no interactive runtime 3D. Static branding appears immediately. Flight only accompanies pending workspace preparation and exits after finishing its entrance when ready, without a fixed five-second hold or replay on routine navigation.

Reanimated and Expo-compatible Skia own beams/stars/grain, bounded chat orb particles and playback bloom. Keep the login field independent of scrolling/keyboard resizing and preserve a quiet form region. Drive work/media forms from actual request/playback state; music bloom claims no spectrum analysis. Target 30 fps for ambient effects. Hidden/backgrounded screens stop decorative clocks; unmount releases resources. Reduced motion or renderer/asset failure uses static equivalents and never blocks authentication/navigation. Verify continuous playback, lifecycle and effects-on/off device performance separately from stills.
