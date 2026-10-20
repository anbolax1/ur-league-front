/** Знак лиги: аирдроп - парашют с ящиком в янтарном квадрате со срезанными углами. */
export function Mark() {
  return (
    <svg className="sf-mark" viewBox="0 0 40 40" aria-hidden>
      <path d="M0 0H32L40 8V40H8L0 32Z" fill="#F2A900" />
      <path
        d="M9 18C9 11 14 7 20 7S31 11 31 18C29 16.6 26.4 16.6 24 18C22.6 16.6 21.3 16.4 20 16.4S17.4 16.6 16 18C13.6 16.6 11 16.6 9 18Z"
        fill="#141003"
      />
      <path d="M9.6 18.6L18.4 27.6M16 18.2L19.2 27.6M24 18.2L20.8 27.6M30.4 18.6L21.6 27.6" fill="none" stroke="#141003" strokeWidth="1.6" />
      <path d="M16.5 27H23.5V33.5H16.5Z" fill="#141003" />
    </svg>
  );
}

/** Название лиги в две строки: игра мелко сверху, имя лиги крупно. */
export function Wordmark() {
  return (
    <span className="sf-wordmark">
      <small>Лига · PUBG Mobile</small>
      <b>Ultimate Royale</b>
    </span>
  );
}
