# 📖 LIVA — Documentation Complète & Directives Architecturales

Bienvenue sur le référentiel officiel du projet **LIVA**, une plateforme web moderne et immersive dédiée à la lecture, à la découverte et à l'écriture d'histoires captivantes.

---

## 🌟 1. Ce que fait l'Application

**LIVA** est une Single Page Application (SPA) ultra-rapide et immersive conçue pour les passionnés de lecture et les auteurs émergents. Elle fusionne le meilleur des plateformes de web-novels, des applications d'écriture modernes et des expériences de découverte visuelle inspirées des réseaux sociaux.

L'application permet aux utilisateurs :
- De dévorer des histoires longues par chapitres ou des formats ultra-courts (*Liva Shorts*).
- De découvrir de nouveaux récits par glissement interactif (*Swipe Story*).
- De personnaliser intégralement leur confort de lecture (polices, marges, thèmes sombres/sépia/nuit, synthèse vocale).
- De plonger dans des atmosphères sonores grâce à un lecteur d'ambiance intégré.
- De rédiger, éditer et publier leurs propres récits via un studio d'écriture dédié.
- D'interagir avec les histoires (commentaires imbriqués, réactions, likes, suivi d'auteurs).

---

## ⚡ 2. Fonctionnalités Implémentées

### 🏠 Page d'Accueil (`HomeView`)
- **Hero Trending Immersif** : Bannière dynamique avec image de fond floutée, badges d'accroche, description et actions rapides (lecture directe, ajout bibliothèque, écoute audio).
- **Filtres de Genres** : Carrousel horizontal fluide avec sélection instantanée par tag.
- **Raccourcis Découverte** : Cartes promotionnelles interactives pour *Swipe Story* et *Recherche par Humeur IA*.
- **Section "Pour vous"** : Recommandations basées sur les préférences de l'utilisateur.
- **Section "Liva Shorts ⚡"** : Récits courts (5 min, 10 min, 15 min) avec filtres de durée.
- **Carrousels Thématiques** : Sections ciblées (Romance, Thriller, Fantasy, etc.).

### 🔍 Exploration & Recherche (`ExploreView`)
- Recherche textuelle en direct par titre, auteur ou mot-clé.
- Filtres combinés par genre, temps de lecture et statut (terminé / en cours).
- Tri avancé (popularité, note moyenne, nouveauté).

### 🃏 Swipe Story (`SwipeView`)
- Interface de découverte gestuelle (style cartes interactives).
- Prévisualisation rapide des synopsis et extraits.
- Actions "Passer ✕" et "Sauvegarder ❤️" avec transitions animées.

### 📖 Lecteur Immersif Sans Distraction (`ReaderView`)
- Découpage par chapitres avec pagination et navigation précédent/suivant.
- **Personnalisation typographique** : Choix des polices (Literata, Merriweather, Sans-Serif), taille de police, interligne, largeur de texte.
- **4 Thèmes de Lecture** : Sombre Cosmique (`#09070F`), Nuit OLED (`#000000`), Sépia Confort (`#F4ECE1`), Jour Épuré (`#FFFFFF`).
- **Mode Synthèse Vocale (TTS)** : Lecture audio assistée via Web Speech API avec contrôle lecture/pause.
- Sauvegarde automatique de la progression de lecture (%) dans l'état global.

### 📝 Fiche Histoire & Commentaires (`StoryView`)
- Informations détaillées sur l'histoire, l'auteur et les statistiques.
- Liste des chapitres avec durée estimée.
- **Système d'avis & notation** : Ajout de commentaires avec notation par étoiles, calcul dynamique de la moyenne.
- **Interactions sociales** : Likes sur les commentaires et réponses imbriquées en cascade.
- Bouton de lancement direct de l'audio d'ambiance.

### 📚 Ma Bibliothèque (`LibraryView`)
- **En cours de lecture** : Cartes avec pourcentage de complétion et reprise en un clic.
- **Histoires sauvegardées / Favoris** : Récits épinglés par le lecteur.
- **Téléchargements hors-ligne** : Simulation des lectures disponibles sans connexion.

### ✍️ Studio Auteur & Espace Création (`CreateView`)
- Protégé par **Route Guard** (connexion obligatoire).
- Tableau de bord des métriques de performance (lectures totales, likes, commentaires, abonnés).
- Gestionnaire de récits avec onglets (Toutes, Publiées, Brouillons).
- Modal complet de rédaction pour créer de nouvelles histoires et ajouter des chapitres.

### 👤 Profils & Espace Personnel (`ProfileView`)
- **Profil Lecteur Connecté** : Avatar, pseudo, biographie éditable, statistiques (histoires lues, heures de lecture), badges de gamification débloqués (Lecteur Passionné, Nuit Blanche, etc.).
- **Bouton Déconnexion Direct** : Positionné de manière ergonomique sous le bouton "Modifier profil".
- **Profil Auteur Public** : Vue dédiée pour consulter les publications d'un auteur et s'abonner/se désabonner.

### 🔐 Authentification & Inscription (`AuthView`)
- Interface plein écran immersive (#09070F avec orbes violet/rose flottantes et bouton de retour à l'accueil).
- Bascule fluide entre Connexion et Inscription.
- Sélection des genres favoris dès la création de compte.
- **Protection Anti-Bruteforce** : Verrouillage temporaire de 30 secondes après 5 tentatives échouées.
- Simulation d'authentification sociale (Google & Apple).

### 🎧 Lecteur Audio Flottant (`AudioPlayer`)
- Barre rétractable en bas d'écran avec contrôle lecture/pause, volume et indicateur de piste.

### 🔔 Tiroir de Notifications
- Menu déroulant avec compteur d'alertes non lues, filtre Toutes / Non lues et actions de purge.

---

## 📁 3. Structure des Fichiers

```
LIVA/
├── .agents/
│   └── rules/
│       └── liva_design_lock.md      # Règle de verrouillage du design du profil
├── .gitignore                       # Protection des fichiers sensibles et logs
├── dev_server.py                    # Serveur de dev Python avec en-têtes HTTP de sécurité
├── index.html                       # Point d'entrée HTML principal (SPA)
├── GEMINI.md                        # Cette documentation
│
├── css/                             # Feuilles de style modulaires Vanilla CSS
│   ├── design-system.css            # Variables globales, couleurs, typographies, tokens
│   ├── base.css                     # Reset, fond d'écran cosmique, conteneurs
│   ├── components.css               # Boutons, badges, modals, cartes génériques, avatars
│   ├── navigation.css               # Sidebar desktop, topbar header, bottom nav mobile
│   ├── home.css                     # Styles spécifiques à la page d'accueil
│   ├── explore.css                  # Grilles de recherche et filtres
│   ├── story-detail.css             # Page de détail d'histoire et fil de commentaires
│   ├── reader.css                   # Lecteur immersif, tiroir de paramètres de lecture
│   ├── library.css                  # Onglets et grilles de bibliothèque
│   ├── author-studio.css            # Tableau de bord auteur et éditeur
│   ├── profile.css                  # Hero card de profil, statistiques, badges
│   ├── swipe-story.css              # Cartes de swipe interactives
│   ├── audio-player.css             # Barre audio flottante persistante
│   └── auth.css                     # Page d'authentification plein écran
│
└── js/                              # Architecture JavaScript Vanilla (ES Modules)
    ├── app.js                       # Routeur SPA, gestion du cycle de vie et initialisation
    ├── state/
    │   └── store.js                 # Store réactif centralisé avec persistance LocalStorage
    ├── data/
    │   ├── stories.js               # Catalogue initial d'histoires riches
    │   ├── authors.js               # Données des auteurs vérifiés
    │   └── genres.js                # Liste des genres littéraires et icônes
    ├── features/
    │   ├── themeManager.js          # Gestionnaire de thèmes (Sombre / Clair)
    │   ├── audioPlayer.js           # Lecteur sonore et ambiance d'arrière-plan
    │   └── aiRecommender.js         # Moteur d'analyse sémantique et recherche par humeur
    ├── components/
    │   ├── StoryCard.js             # Générateur des cartes d'histoires (Vertical, Short, ReadingNow)
    │   ├── Modal.js                 # Contrôleur générique des fenêtres modales
    │   └── Toast.js                 # Système de notifications Toast flottantes
    ├── utils/
    │   └── sanitize.js              # Utilitaires de sécurité anti-XSS (escapeHTML, sanitizeURL)
    └── views/
        ├── HomeView.js              # Vue Accueil
        ├── ExploreView.js           # Vue Exploration & Recherche
        ├── StoryView.js             # Vue Détail d'une histoire
        ├── ReaderView.js            # Vue Lecteur de chapitre
        ├── LibraryView.js           # Vue Bibliothèque personnelle
        ├── CreateView.js            # Vue Studio d'écriture auteur
        ├── ProfileView.js           # Vue Profil utilisateur et auteur public
        ├── SwipeView.js             # Vue Découverte Swipe
        ├── OnboardingView.js        # Vue Modal de premier accueil
        └── AuthView.js              # Vue Connexion & Inscription
```

---

## 🛠️ 4. Technologies Utilisées

| Domaine | Technologie | Justification |
| :--- | :--- | :--- |
| **Structure** | **HTML5 Sémantique** | Balisage accessible, léger et SEO-friendly. |
| **Styles** | **Vanilla CSS3** | Custom Properties CSS, Grid & Flexbox, Glassmorphism, animations fluides `@keyframes`. Zéro dépendance CSS lourde. |
| **Logique & SPA** | **JavaScript ES6+ (Modules Natifs)** | Architecture modulaire propre avec `import/export`, aucun bundler obligatoire, 0 ms de temps de compilation. |
| **Stockage & État** | **LocalStorage & Store Réactif** | Persistance des préférences, de la bibliothèque, des brouillons et de la progression de lecture. |
| **Audio & Voix** | **Web Audio & Web Speech API** | Lecture d'ambiance et synthèse vocale sans dépendances cloud payantes. |
| **Serveur de Dev** | **Python 3 (`http.server`)** | Serveur léger avec en-têtes HTTP de sécurité (`nosniff`, `SAMEORIGIN`, `strict-origin`). |
| **Contrôle de Version** | **Git & GitHub** | Dépôt distant synchronisé en SSH sur la branche `main`. |

---

## 🎨 5. Décisions de Design

1. **Ambiance Sombre & Cosmique ("Dark Elegance")** :
   - Fond profond `#09070F` rehaussé de dégradés violets (`#7928CA`), roses néon (`#FF0080`) et d'accents dorés (`#FFB800`).
   - Finitions en **Glassmorphism** (`background: rgba(18, 14, 28, 0.7)`, `backdrop-filter: blur(16px)`).
2. **Typographie Hybride Haut de Gamme** :
   - **Outfit** pour les titres marquants et la marque.
   - **Plus Jakarta Sans** pour une lisibilité parfaite des interfaces d'application.
   - **Literata** et **Merriweather** pour un rendu digne des livres de collection dans le lecteur.
3. **Micro-Interactions Vivantes** :
   - Effets de survol avec élévation et halos lumineux (`box-shadow: 0 10px 30px rgba(...)`).
   - Carrousels avec barres de défilement masquées pour une ergonomie moderne.
4. **Sécurité Défensive Native** :
   - Sanitisation systématique de tous les contenus générés par l'utilisateur via `escapeHTML()` dans [`js/utils/sanitize.js`](file:///Users/macbookairm2/Documents/LIVA/js/utils/sanitize.js) pour bloquer les failles XSS (CWE-79).
   - Zéro mot de passe codé en dur ou stocké en clair dans le `localStorage` (CWE-798 & CWE-312).

---

## 🤖 6. Instructions pour un Futur Modèle d'IA

Lors de toute intervention future sur ce projet, vous **DEVEZ** respecter scrupuleusement les consignes suivantes :

### ⚠️ Règles Architecturales Impératives
1. **Pas de Frameworks Externes** : Ne transformez pas ce projet en React, Vue, Next.js ou Tailwind. Le projet est et doit rester en **Vanilla JavaScript ES Modules** et **Vanilla CSS**.
2. **Cycle de Vie du DOM & Initialisation** :
   Dans [`js/app.js`](file:///Users/macbookairm2/Documents/LIVA/js/app.js), veillez à toujours conserver l'initialisation sécurisée :
   ```javascript
   if (document.readyState === 'loading') {
     document.addEventListener('DOMContentLoaded', initApp);
   } else {
     initApp();
   }
   ```
3. **Portée des Variables dans le Routeur** :
   Dans la méthode `handleRoute()` de [`js/app.js`](file:///Users/macbookairm2/Documents/LIVA/js/app.js), **ne redéclarez jamais** de variables de même nom (ex: `isAuthPage` vs `isAuthenticated`) pour éviter les erreurs de compilation fatales (`SyntaxError`).
4. **Sanitisation Anti-XSS Obligatoire** :
   Chaque fois que vous injectez du texte dynamique utilisateur dans un template literal HTML (`innerHTML`), vous **DEVEZ importer et utiliser `escapeHTML()`** depuis `../utils/sanitize.js`.
5. **Règles de Design du Profil** :
   Consultez le fichier [`.agents/rules/liva_design_lock.md`](file:///Users/macbookairm2/Documents/LIVA/.agents/rules/liva_design_lock.md). Le bouton `🚪 Déconnexion` doit rester placé **directement en dessous de `✏️ Modifier profil`** à droite du hero card, et aucune section d'ambiance superflue ne doit être rajoutée à cet endroit.
6. **Cache-Busting** :
   Lors d'une modification structurelle des scripts ou feuilles de style, incrémentez le paramètre de version (`?v=X`) dans [`index.html`](file:///Users/macbookairm2/Documents/LIVA/index.html) et les imports de [`js/app.js`](file:///Users/macbookairm2/Documents/LIVA/js/app.js) pour éviter tout problème de cache navigateur.
7. **Validation Avant Commit** :
   Avant de pousser du code sur GitHub, vérifiez systématiquement la syntaxe des fichiers JavaScript à l'aide de l'interpréteur système.
