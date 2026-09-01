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
  marquee: {
    template: "Oyez ! Oyez ! {brick} est passée de {from} à {to} !",
    empty: "Oyez ! Oyez ! Venez contempler les Briques de l'Honneur et de la Honte !",
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
  login: {
    signIn: "Entrer dans le donjon",
  },
  notFound: {
    title: "Halte ! Qui va là ?",
    description: "Nulle page n'existe en ces terres.",
  },
} as const;

export default fr;
