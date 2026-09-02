function Badge({
  children,
  bg,
  fg,
  border,
}: {
  bg: string;
  fg: string;
  border: string;
  children: React.ReactNode;
}) {
  return (
    <svg width="88" height="31" role="img" className="bevel">
      <rect width="88" height="31" fill={bg} stroke={border} strokeWidth="2" />
      <text
        x="44"
        y="13"
        textAnchor="middle"
        fill={fg}
        fontFamily="'Comic Sans MS', 'Comic Neue', cursive"
        fontSize="9"
        fontWeight="bold"
      >
        {children}
      </text>
    </svg>
  );
}

export default function Badges88() {
  return (
    <div className="inline-flex items-center gap-2">
      <Badge bg="#1a1a2e" fg="#e8dca8" border="#c9b370">
        ⚜ YE OLDE WEB ⚜
      </Badge>
      <Badge bg="#000080" fg="#ffffff" border="#c0c0c0">
        800×600 APPROVED
      </Badge>
      <Badge bg="#800000" fg="#ffd700" border="#c0c0c0">
        NO SERIFS ZONE
      </Badge>
    </div>
  );
}
