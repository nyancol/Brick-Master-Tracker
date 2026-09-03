const fr = {
  title: "La Brique",
  subtitle: "Les briques légendaires de l'Honneur et de la Honte",
  honor: {
    name: "Brique de l'Honneur",
    heldBy: "Actuellement détenue par",
    transferTo: "Décerner à",
    waitingForTransfer: "En attente que {name} transfère…",
  },
  shame: {
    name: "Brique de la Honte",
    cursedUpon: "Actuellement maudite sur",
    offloadTo: "Refiler à",
    waitingForTransfer: "En attente que {name} transfère…",
  },
  chronicles: {
    title: "La Grande Chronique",
    empty: "Aucune entrée enregistrée.",
    chapter: "Chapitre",
    editedBy: "Modifié par",
    on: "le",
    yearGroup: "Année",
    forgedUnto: "La {brick} fut forgée et remise à {name}",
  },
  modal: {
    cancel: "Annuler",
    confirm: "Sceller à jamais",
    descriptionLabel: "Inscris ton exploit dans la chronique...",
    descriptionRequired: "Une description est requise.",
    uploadPhoto: "Ajouter des photos",
    uploading: "Envoi en cours...",
  },
  edit: {
    save: "Enregistrer",
    edit: "Modifier",
    deletePhoto: "Supprimer la photo",
    confirmDeletePhoto: "Es-tu sûr de vouloir supprimer cette photo ?",
  },
  loading: "Invocation des briques...",
  transferFailed: "Échec du transfert",
  logout: "Fuir le donjon",
  role: {
    knight: "Chevalier",
    visitor: "Visiteur",
  },
  visitor: {
    banner:
      "Les Visiteurs regardent, les Chevaliers de l'Amitié portent la brique.",
  },
  transfer: {
    onlyKnights: "Seuls les Chevaliers de l'Amitié peuvent transférer la brique.",
    recipientNotKnight:
      "Cette âme n'est pas un participant — seuls les Chevaliers de l'Amitié peuvent porter la brique.",
  },
  marquee: {
    template: "Oyez ! Oyez ! {brick} est passée de {from} à {to} !",
    forged: "Oyez ! Oyez ! La {brick} fut forgée et remise à {to} !",
    empty: "Oyez ! Oyez ! Venez contempler les Briques de l'Honneur et de la Honte !",
  },
  tenure: {
    ledgerTitle: "Registre des Tenures",
    neverHeld: "ne l'a jamais tenue",
  },
  footer: {
    counterLabel: "Tu es le visiteur numéro",
    webringTitle: "⚜ L'Anneau Web des Briques ⚜",
    prev: "‹ préc.",
    random: "au hasard",
    next: "suivant ›",
    bestViewed:
      "Optimisé pour Netscape Navigator 4.0 en 800×600 — sous peine de voir ton ordinateur saisi par la Couronne.",
    construction: "En construction par les Maçons du Roi",
  },
  lute: {
    play: "Jouer du luth",
    stop: "Faire taire le luth",
  },
  sfx: {
    enable: "Sortir l'épée du fourreau",
    disable: "Rendre les sons au silence",
  },
  window: {
    minimize: "Rien à réduire, mon seigneur",
    maximize: "Elle remplit déjà ton écran",
    close: "Fermer la fenêtre",
    refuseHonor: "Impossible de fermer l'Honneur !",
    refuseShame: "La Honte s'accroche encore à toi !",
    brickCount: "1 brique(s)",
    modem: "modem 56k",
    bestowTitle: "Décerner la Brique — {name}",
    offloadTitle: "Refiler la Brique — {name}",
    recipient: "Destinataire : {name}",
  },
  login: {
    signIn: "Entrer dans le donjon",
  },
  notFound: {
    title: "Halte ! Qui va là ?",
    description: "Nulle page n'existe en ces terres.",
  },
} as const;

export default fr;
