# LIVA — RÈGLE OFFICIELLE : VERROUILLAGE DU DESIGN SYSTEM & PRÉSERVATION UI/UX

## Statut : VERROUILLAGE ABSOLU

Le design actuel de **Liva** constitue le **Design Maître Officiel** et la **Source Unique de Vérité**.

### 1. Interdictions Strictes
- Ne JAMAIS refaire ou réinterpréter l'identité visuelle de Liva.
- Ne JAMAIS changer la palette de couleurs officielle :
  - **Mode Sombre** : Fond `#0D0B14`, Surfaces `#14111E`, Cartes `#1A1628`, Accent Violet `#8B5CF6`, Rose `#F43F5E`, Or `#F59E0B`.
  - **Mode Clair** : Fond `#FAF9F6`, Cartes `#FFFFFF`, Accent Indigo `#6366F1`.
  - **Mode Crème** : Fond `#F5EFE6`, Cartes `#EFE8DA`, Accent `#854D0E`.
- Ne JAMAIS modifier la typographie officielle (*Plus Jakarta Sans*, *Outfit*, *Literata*, *Merriweather*).
- Ne JAMAIS altérer les espacements, arrondis (`--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl`), ombres et transitions existants.
- Ne JAMAIS modifier arbitrairement les écrans validés (Accueil, Explorer, Détail Histoire, Lecteur Immersif, Bibliothèque, Studio Auteur, Profils, Swipe Story, Lecteur Audio).

### 2. Protocole pour Toute Nouvelle Fonctionnalité
1. Analyser les composants existants (`StoryCard`, `Button`, `Modal`, `Toast`, etc.).
2. Réutiliser rigoureusement les variables de `design-system.css` et `components.css`.
3. Étendre sans dénaturer.
4. Assurer la compatibilité parfaite sur les 3 thèmes (Sombre, Clair, Crème) et les versions mobile + desktop.
5. Appliquer le principe de modification minimale.
