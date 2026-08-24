let
  nixpkgs = fetchTarball "https://github.com/NixOS/nixpkgs/tarball/nixos-26.05";
  pkgs = import nixpkgs { config = {}; overlays = []; };

in
pkgs.mkShellNoCC {
  packages = with pkgs; [
    nodejs_22
    neovim
    openspec
    pnpm
    git
    opencode
    gcc
    gnumake
    python3
  ];
  LOCALE_ARCHIVE = "${pkgs.glibcLocales}/lib/locale/locale-archive";
}
