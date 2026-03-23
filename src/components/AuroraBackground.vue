<template>
  <div class="contents">
    <slot />
    <!-- animated orbs -->
    <div class="orb orb-cyan" aria-hidden="true" />
    <div class="orb orb-purple" aria-hidden="true" />
    <div class="orb orb-pink" aria-hidden="true" />
  </div>
</template>

<style scoped>
.aurora-root {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: linear-gradient(170deg, #f8fbff 0%, #f3f6fc 55%, #f5f0fb 100%);
}

.aurora-content {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
}

/* ---- shared orb base ---- */
.orb {
  position: fixed;
  border-radius: 50%;
  pointer-events: none;
  filter: blur(72px);
  will-change: transform, opacity;
}

/* ---- cyan — top-left ---- */
.orb-cyan {
  width: 55vw;
  height: 55vw;
  top: -12%;
  left: -8%;
  background: radial-gradient(circle, rgb(34 211 238 / 0.26), transparent 62%);
  animation: drift-a 14s ease-in-out infinite;
}

/* ---- purple — bottom-right ---- */
.orb-purple {
  width: 48vw;
  height: 48vw;
  bottom: -10%;
  right: -6%;
  background: radial-gradient(circle, rgb(120 37 234 / 0.22), transparent 60%);
  animation: drift-b 18s ease-in-out infinite;
}

/* ---- pink — mid-left ---- */
.orb-pink {
  width: 36vw;
  height: 36vw;
  top: 40%;
  left: 10%;
  background: radial-gradient(circle, rgb(164 48 115 / 0.16), transparent 60%);
  animation: drift-c 22s ease-in-out infinite;
}

/* ---- keyframes ---- */
@keyframes drift-a {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
    opacity: 0.9;
  }
  30% {
    transform: translate(5vw, 4vh) scale(1.06);
    opacity: 1;
  }
  65% {
    transform: translate(-3vw, 7vh) scale(0.96);
    opacity: 0.8;
  }
}

@keyframes drift-b {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
    opacity: 0.85;
  }
  35% {
    transform: translate(-6vw, -5vh) scale(1.09);
    opacity: 1;
  }
  72% {
    transform: translate(4vw, -2vh) scale(0.94);
    opacity: 0.75;
  }
}

@keyframes drift-c {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
    opacity: 0.7;
  }
  28% {
    transform: translate(7vw, -6vh) scale(1.12);
    opacity: 0.9;
  }
  60% {
    transform: translate(-4vw, 5vh) scale(0.91);
    opacity: 0.6;
  }
}
</style>
