# CasaClara — Apps Nativas (Android + iOS)

Wrapper nativo da app web CasaClara (v2) feito com [Capacitor 7](https://capacitorjs.com).
O código web vive em `www/` e é a única fonte de verdade — depois de qualquer alteração, corre `npx cap sync`.

## Estrutura

```
casaclara-native/
├── www/                  → app web (index.html, styles.css, app.js)
├── android/              → projeto Android Studio / Gradle
├── ios/                  → projeto Xcode
└── capacitor.config.json → appId: com.casaclara.app
```

## Diferenças face à versão web

As notificações foram adaptadas em `www/app.js`: em ambiente nativo usam o plugin
`@capacitor/local-notifications` (lembretes diários repetidos, funcionam com a app fechada);
no browser continuam a usar a Notification API. O AndroidManifest inclui as permissões
`POST_NOTIFICATIONS`, `SCHEDULE_EXACT_ALARM`, `RECEIVE_BOOT_COMPLETED`, etc.

## Android

APK de debug já compilado: `CasaClara-v2-android-debug.apk` (na pasta output).
Instalação: copiar para o telemóvel e abrir (requer "instalar apps de fontes desconhecidas").

Para recompilar:
```bash
cd android
export ANDROID_HOME=<caminho do SDK> JAVA_HOME=<JDK 21>
./gradlew assembleDebug        # APK de debug
```

Para publicar na Play Store:
1. `keytool -genkey -v -keystore casaclara.keystore -alias casaclara -keyalg RSA -keysize 2048 -validity 10000`
2. `./gradlew bundleRelease` → `.aab` em `app/build/outputs/bundle/release/`
3. Assinar com a keystore e fazer upload na Play Console.

## iOS

Requer um Mac com Xcode e CocoaPods (não é possível compilar em Linux):

```bash
cd ios/App
pod install          # primeira vez
open App.xcworkspace # abrir no Xcode
```

No Xcode: escolher a equipa de assinatura (Apple ID gratuito serve para testar no próprio
iPhone; distribuição na App Store requer conta Apple Developer, 99 €/ano).

## Notas

- O ícone e splash screen são os padrão do Capacitor — personalizar com
  `@capacitor/assets` a partir de um `icon.png` 1024×1024.
- Os dados (localStorage) da versão web não migram automaticamente para a app nativa.
