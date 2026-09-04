const en = {
  title: "The Brick",
  subtitle: "Legendary tokens of Honor and Shame",
  honor: {
    name: "Brick of Honor",
    heldBy: "Currently held by",
    transferTo: "Bestow upon",
    waitingForTransfer: "Waiting for {name} to transfer…",
  },
  shame: {
    name: "Brick of Shame",
    cursedUpon: "Currently cursed upon",
    offloadTo: "Offload upon",
    seize: "Seize the Shame",
    holderWaiting:
      "The Shame clingeth to thee still — only a noble knight may seize it from thee.",
    waitingForTransfer: "Waiting for {name} to transfer…",
  },
  chronicles: {
    title: "þe Grete Chronicle",
    empty: "No entries recorded yet.",
    chapter: "Chapter",
    editedBy: "Edited by",
    on: "on",
    yearGroup: "Year",
    forgedUnto: "The {brick} was forged unto {name}",
  },
  modal: {
    cancel: "Cancel",
    confirm: "Set þe Seal",
    descriptionLabel: "Inscribe thy tale in þe chronicle...",
    descriptionRequired: "A description is required.",
    uploadPhoto: "Add photos",
    uploading: "Uploading...",
  },
  edit: {
    save: "Save",
    edit: "Edit",
    deletePhoto: "Delete photo",
    confirmDeletePhoto: "Are you sure you want to delete this photo?",
  },
  loading: "Summoning þe bricks...",
  transferFailed: "Transfer failed",
  logout: "Flee þe Keep",
  role: {
    knight: "Knight",
    visitor: "Visitor",
  },
  visitor: {
    banner:
      "Visitors behold from þe ramparts — only þe Knights of Friendship carry þe brick.",
  },
  transfer: {
    onlyKnights: "Only Knights of Friendship can transfer the brick.",
    recipientNotKnight:
      "That soul is not a participant — only Knights of Friendship can hold the brick.",
    shameCannotBeGiven:
      "The Shame cannot be given — it must be seized by another knight.",
    seizeOnlyAnotherKnight:
      "The Shame is thine already — only another knight may seize it from thee.",
    seizeOnlyKnights: "Only Knights of Friendship may seize the Shame.",
  },
  marquee: {
    template: "Hear Ye! Hear Ye! {brick} hath passed from {from} unto {to}!",
    forged: "Hear Ye! Hear Ye! The {brick} was forged unto {to}!",
    empty: "Hear Ye! Hear Ye! Come, behold þe Bricks of Honor and Shame!",
  },
  tenure: {
    ledgerTitle: "Ledger of Tenure",
    neverHeld: "hath never held it",
  },
  marginalia: {
    header: "In þe Margins",
    glossCount: "{count} glosses",
    empty: "No glosses yet — be þe first to scribe.",
    placeholder: "Add thy gloss to þe tale...",
    submit: "Affix þy Seal",
    tooLong: "Thy gloss runneth long — 500 letters at most.",
    huzzah: "Huzzah!",
    huzzahRebuke: "Thou hast already proclaimed thy huzzah!",
    blot: "Blot it out",
    blotted: "Here a word was blotted out.",
    confirmBlot: "Blot out this gloss? It shall remain, half-legible, as a warning.",
    chisel: "Chisel it from the record",
    confirmChisel: "Chisel this blotted gloss from the record entirely?",
    age: {
      now: "but now",
      today: "this very day",
      yestereve: "yestereve",
      past: "{days} days past",
    },
  },
  footer: {
    counterLabel: "Thou art visitor number",
    webringTitle: "⚜ Ye Olde Brick Webring ⚜",
    prev: "‹ prev",
    random: "random",
    next: "next ›",
    bestViewed:
      "Best viewed in Netscape Navigator 4.0 at 800×600 — lest thy computer be seized by þe Crown.",
    construction: "Under construction by þe King's Masons",
  },
  lute: {
    play: "Play the lute",
    stop: "Silence the lute",
  },
  sfx: {
    enable: "Unsheathe the sounds",
    disable: "Silence the sounds",
  },
  window: {
    minimize: "Nothing to minimize, my liege",
    maximize: "It already filleth thy screen",
    close: "Close window",
    refuseHonor: "Thou canst not close the Honor!",
    refuseShame: "The Shame clingeth to thee still!",
    brickCount: "1 brick(s)",
    modem: "56k modem",
    bestowTitle: "Bestow the Brick — {name}",
    offloadTitle: "Offload the Brick — {name}",
    seizeTitle: "Seize the Shame — {name}",
    seizeFrom: "Seizing from: {name}",
    recipient: "Recipient: {name}",
  },
  login: {
    signIn: "Enter þe Keep",
  },
  notFound: {
    title: "Halt! Who goes there?",
    description: "No such page exists in these lands.",
  },
} as const;

export default en;
