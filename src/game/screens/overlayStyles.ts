// Keyframe CSS shared by the menu/overlay screens that use the
// `menu-screen-enter` / `menu-spring-in` entrance animation. Kept as an
// exported string (rather than a CSS file) so it can be dropped verbatim
// into a `<style>` tag, exactly as it was inline in Game.tsx.
export const OVERLAY_KEYFRAMES = `
        @keyframes menu-spring-in {
          0% { opacity: 0; transform: scale(0.96) translateY(8px); }
          60% { opacity: 1; transform: scale(1.01) translateY(-1px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .menu-screen-enter {
          position: absolute;
          inset: 0;
          opacity: 1;
          animation: menu-spring-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `
