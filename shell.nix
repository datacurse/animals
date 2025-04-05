{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  buildInputs = with pkgs; [
    nodejs_22
    nodePackages.pnpm
    typescript
  ];

  shellHook = ''
    echo "Node.js development environment"
    echo "Node.js: $(${pkgs.nodejs_22}/bin/node --version)"
    echo "pnpm: $(${pkgs.nodePackages.pnpm}/bin/pnpm --version)"
    echo "TypeScript: $(${pkgs.typescript}/bin/tsc --version)"
    
    # Ensure pnpm is properly configured
    pnpm config set store-dir ~/.pnpm-store
  '';
}
