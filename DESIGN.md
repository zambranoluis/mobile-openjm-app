# OpenJM native design

The approved OpenJM identity is Calm Intelligence: readable dark working surfaces, content first, meaningful green actions and recognizable hummingbird branding. Adapt the interaction to the OS while keeping that identity.

## Tokens

Canvas `#080B0A`, panel `#151A19`, elevated `#1A2226`, field `#1B2023`, primary text `#F2F4F3`, secondary text `#A9B5AF`, muted text `#84928B`, brand green `#52B583`, action mint `#19D18C`, pressed mint `#19B87C`, danger `#F05257`, warning `#F0BE48`. Mint-filled controls use canvas foreground. Selection also has a checkmark or explicit accessibility state. Spacing uses 4, 8, 12, 16, 24, 32; controls use an 8-unit radius and working panels 16.

Use the system font on iOS and Android, mapped to body, control, metadata and title roles with font scaling enabled. Body is 17 on iOS and 16 on Android. Titles are 28–34; controls 16; metadata 13. No fixed-height text containers, capped font scaling or truncation of critical feedback. Long response text is selectable.

## Navigation and behavior

Three native tabs: Conversations, Apps, Account. Use a navigation stack for details and self-contained sheets for short tasks. Preserve iOS edge swipe and Android system Back. Account uses grouped settings lists. Forms scroll inside safe areas and above the keyboard. Minimum controls are 48 units on Android and 44 on iOS. Large text may increase control height.

The conversation composer remains reachable with a visible keyboard; history and responses scroll natively. Loading, offline, pending and failure states remain explicit. Failed requests retain input and offer an intentional retry. Immediate state changes are the default; native transitions honor reduced motion. Permission prompts follow a user action and explain its benefit.

Native screen verification requires installed-app capture on each OS. An Expo browser preview is only a bundle/interaction aid and cannot approve platform layout or lifecycle.
