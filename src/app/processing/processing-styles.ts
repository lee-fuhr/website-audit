// CSS animations for fade transitions and shimmer on the processing page
export const processingStyles = `
  @keyframes fadeInOut {
    0% { opacity: 0; }
    10% { opacity: 1; }
    90% { opacity: 1; }
    100% { opacity: 0; }
  }

  @keyframes phaseOut {
    0% { opacity: 1; }
    100% { opacity: 0; }
  }

  @keyframes phaseIn {
    0% { opacity: 0; }
    100% { opacity: 1; }
  }

  .phase-out {
    animation: phaseOut 1s ease-out forwards;
  }

  .phase-in {
    animation: phaseIn 0.5s ease-in forwards;
  }

  @keyframes shimmer {
    0% {
      background-position: -200px 0;
    }
    100% {
      background-position: 200px 0;
    }
  }

  @keyframes dotFade {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 1; }
  }

  .fade-message {
    animation: fadeInOut 0.6s ease-in-out;
  }

  .shimmer-bar {
    position: relative;
    overflow: hidden;
  }

  .shimmer-bar::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.4),
      transparent
    );
    background-size: 200px 100%;
    animation: shimmer 1.5s infinite;
  }

  .dot-1 { animation: dotFade 1.2s infinite 0s; }
  .dot-2 { animation: dotFade 1.2s infinite 0.4s; }
  .dot-3 { animation: dotFade 1.2s infinite 0.8s; }
`
