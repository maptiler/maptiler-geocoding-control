<div>
  <svg viewBox="0 0 18 18" width="24" height="24">
    <path
      fill="#333"
      d="M4.4 4.4l.8.8c2.1-2.1 5.5-2.1 7.6 0l.8-.8c-2.5-2.5-6.7-2.5-9.2 0z"
    />
    <path
      opacity=".1"
      d="M12.8 12.9c-2.1 2.1-5.5 2.1-7.6 0-2.1-2.1-2.1-5.5 0-7.7l-.8-.8c-2.5 2.5-2.5 6.7 0 9.2s6.6 2.5 9.2 0 2.5-6.6 0-9.2l-.8.8c2.2 2.1 2.2 5.6 0 7.7z"
    />
  </svg>
</div>

<style>
  div {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;

    display: flex;
    align-items: center;
  }

  svg {
    animation: rotate 0.8s infinite cubic-bezier(0.45, 0.05, 0.55, 0.95);
  }

  @keyframes rotate {
    from {
      -webkit-transform: rotate(0);
      transform: rotate(0);
    }
    to {
      -webkit-transform: rotate(360deg);
      transform: rotate(360deg);
    }
  }
</style>
