#!/bin/bash
# ============================================================
# CasaClara — Preparação iOS no Mac
# Uso: ./instalar-ios.sh
# ============================================================
set -e

echo "⌂ CasaClara — preparar app iOS"
echo "--------------------------------"

# 1. Verificar Xcode
if ! xcodebuild -version >/dev/null 2>&1; then
  echo "❌ Xcode não encontrado."
  echo "   Instala-o na App Store (gratuito) e volta a correr este script."
  exit 1
fi
echo "✓ Xcode $(xcodebuild -version | head -1 | awk '{print $2}')"

# Aceitar licença do Xcode se necessário
if ! xcodebuild -license check >/dev/null 2>&1; then
  echo "→ A aceitar licença do Xcode (pode pedir password)..."
  sudo xcodebuild -license accept
fi

# 2. Homebrew
if ! command -v brew >/dev/null 2>&1; then
  echo "→ A instalar Homebrew (vai pedir a tua password)..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  # Apple Silicon: adicionar brew ao PATH desta sessão
  [ -f /opt/homebrew/bin/brew ] && eval "$(/opt/homebrew/bin/brew shellenv)"
fi
echo "✓ Homebrew"

# 3. Node.js (≥ 22)
if ! command -v node >/dev/null 2>&1 || [ "$(node -v | cut -dv -f2 | cut -d. -f1)" -lt 22 ]; then
  echo "→ A instalar Node.js 22..."
  brew install node@22
  brew link --overwrite node@22 2>/dev/null || true
fi
echo "✓ Node $(node -v)"

# 4. CocoaPods
if ! command -v pod >/dev/null 2>&1; then
  echo "→ A instalar CocoaPods..."
  brew install cocoapods
fi
echo "✓ CocoaPods $(pod --version)"

# 5. Dependências do projeto
echo "→ A instalar dependências npm..."
npm install

echo "→ A sincronizar o projeto iOS (Capacitor)..."
npx cap sync ios

echo "→ A instalar pods..."
(cd ios/App && pod install)

echo ""
echo "✅ Tudo pronto! A abrir o Xcode..."
open ios/App/App.xcworkspace

cat << 'EOF'

--------------------------------
Últimos 2 passos (no Xcode):
  1. Seleciona "App" na barra lateral → Signing & Capabilities
     → em "Team" escolhe o teu Apple ID.
  2. Liga o iPhone por cabo, escolhe-o no seletor de destino
     e carrega em ▶️ (Run).

No iPhone (só na 1ª vez): Definições → Geral → VPN e Gestão
de Dispositivos → Confiar no teu perfil de programador.

Nota: com Apple ID gratuito a app fica ativa 7 dias.
App Store / TestFlight requerem conta Apple Developer (99 €/ano).
--------------------------------
EOF
