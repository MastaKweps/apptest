# -*- coding: utf-8 -*-
import logging
import os
import json # Importer pour lire les web_app_data
from dotenv import load_dotenv
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, ContextTypes, MessageHandler, filters
from telegram.constants import ParseMode

# Charger les variables définies dans le fichier .env
load_dotenv()

# Configuration du logging
logging.basicConfig(format="%(asctime)s - %(name)s - %(levelname)s - %(message)s", level=logging.INFO)
logging.getLogger("httpx").setLevel(logging.WARNING)
logger = logging.getLogger(__name__)

# --- Récupération de la Configuration depuis .env ---
TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
LIEN_SIGNAL = os.getenv("SIGNAL_LINK") # Sera None si commenté dans .env
MINI_APP_URL = os.getenv("MINI_APP_URL")
BANNER_IMAGE_URL = os.getenv("BANNER_IMAGE_URL")
CHANNEL_URL = os.getenv("CHANNEL_URL") # Sera None si commenté ou absent
INSTAGRAM_URL = os.getenv("INSTAGRAM_URL") # Sera None si commenté ou absent

# --- Vérification Configuration Essentielle ---
if not TOKEN:
    logger.critical("ERREUR CRITIQUE: TELEGRAM_BOT_TOKEN manquant dans .env")
    exit("Token non trouvé. Arrêt.")
if not MINI_APP_URL:
    # Si l'URL de la Mini App manque, on ne peut pas la lancer
    logger.error("ERREUR: MINI_APP_URL manquant dans .env. Le bouton 'Catalogue' ne fonctionnera pas.")
    # On pourrait décider d'arrêter le bot ici ou de continuer sans le bouton MiniApp
    # exit("URL Mini App manquante.") # Décommentez pour arrêter si l'URL est essentielle
if not BANNER_IMAGE_URL:
    logger.warning("BANNER_IMAGE_URL manquant dans .env. L'accueil n'aura pas d'image.")


# === Fonction pour la commande /start ===
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Envoie le message d'accueil avec image et boutons."""
    user = update.effective_user
    logger.info(f"Commande /start reçue de {user.username} (ID: {user.id})")

    # Texte du message d'accueil (avec formatage HTML)
    welcome_text = (
        f"Miaourrrr {user.mention_html()} ! 👋\n\n"
        "Bienvenue sur le bot officiel de <b>Super Croquettes Chat</b> !\n\n"
        "Découvrez nos délicieuses recettes spécialement conçues pour votre félin préféré. 😻\n"
        "Cliquez sur <b>Notre Catalogue</b> pour explorer."
    )

    # --- Création des boutons ---
    keyboard_rows = []

    # Ligne 1: Info & Contact
    row1 = []
    row1.append(InlineKeyboardButton("Informations ℹ️", callback_data='show_info'))
    # Utiliser le lien Signal s'il existe, sinon ne pas afficher le bouton Contact
    if LIEN_SIGNAL:
         row1.append(InlineKeyboardButton("Contact (Signal) 📧", url=LIEN_SIGNAL))
    else:
        # Si pas de lien signal, on peut mettre un bouton placeholder ou rien du tout
        # row1.append(InlineKeyboardButton("Contact 📧", callback_data='contact_info')) # Alternative
        pass # Ne rien ajouter si le lien Signal n'est pas défini
    keyboard_rows.append(row1)

    # Ligne 2: Mini App Catalogue
    if MINI_APP_URL: # Afficher le bouton seulement si l'URL existe
        keyboard_rows.append([
            InlineKeyboardButton("Notre Catalogue 🐾", web_app=WebAppInfo(url=MINI_APP_URL))
        ])
    else:
         keyboard_rows.append([
             InlineKeyboardButton("Catalogue (Indisponible)", callback_data='no_action') # Bouton désactivé
         ])


    # Ligne 3: Liens Optionnels (Canal, Instagram)
    optional_buttons_row = []
    if CHANNEL_URL:
        optional_buttons_row.append(InlineKeyboardButton("Notre Canal ↗️", url=CHANNEL_URL))
    if INSTAGRAM_URL:
        optional_buttons_row.append(InlineKeyboardButton("Instagram ↗️", url=INSTAGRAM_URL))

    if optional_buttons_row: # Ajouter la ligne seulement si elle contient des boutons
        keyboard_rows.append(optional_buttons_row)

    # Assembler le clavier
    reply_markup = InlineKeyboardMarkup(keyboard_rows)

    # --- Envoyer le message ---
    if BANNER_IMAGE_URL:
        try:
            await update.message.reply_photo(
                photo=BANNER_IMAGE_URL,
                caption=welcome_text,
                parse_mode=ParseMode.HTML,
                reply_markup=reply_markup
            )
        except Exception as e:
            logger.error(f"Erreur lors de l'envoi de la photo d'accueil: {e}. Envoi du texte seul.")
            # Envoyer juste le texte si la photo échoue
            await update.message.reply_text(
                text=welcome_text,
                parse_mode=ParseMode.HTML,
                reply_markup=reply_markup
            )
    else:
        # Envoyer juste le texte si pas d'URL de bannière
        await update.message.reply_text(
            text=welcome_text,
            parse_mode=ParseMode.HTML,
            reply_markup=reply_markup
        )


# === Fonction pour gérer le clic sur le bouton "Informations" ===
async def show_info_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Envoie le message d'information quand le bouton est cliqué."""
    query = update.callback_query
    await query.answer() # Important: Confirmer la réception du clic

    # --- Personnalisez ce texte ---
    info_text = (
        "<b>ℹ️ Informations Utiles :</b>\n\n"
        "Nos croquettes sont préparées avec amour et des ingrédients de première qualité pour assurer la santé et le bonheur de votre chat.\n\n"
        "✅ Sans céréales ajoutées (selon recettes)\n"
        "✅ Riches en protéines animales\n"
        "✅ Favorisent un pelage brillant et une bonne digestion\n\n"
        "➡️ Explorez notre gamme complète via le bouton 'Notre Catalogue' !"
    )
    # --- Fin du Texte ---

    # Répondre en envoyant un nouveau message dans le chat
    await query.message.reply_text(text=info_text, parse_mode=ParseMode.HTML, disable_web_page_preview=True)


# === Fonction pour gérer les données reçues de la Mini App ===
async def web_app_data_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Gère les données reçues depuis la Mini App (ex: clic sur Commander)."""
    user = update.effective_user
    if not update.message or not update.message.web_app_data:
        logger.warning("web_app_data_handler appelé sans données WebApp.")
        return

    data_str = update.message.web_app_data.data
    logger.info(f"Données reçues de la Mini App par {user.username}: {data_str}")

    reply_text = "Nous avons bien reçu votre demande depuis le catalogue. Merci !" # Message par défaut
    try:
        app_data = json.loads(data_str) # Essayer de parser le JSON reçu
        # Si l'action est 'order_product' (comme défini dans notre JS)
        if app_data.get("action") == "order_product":
            product = app_data.get("product", {}) # Récupérer l'objet produit
            product_name = product.get("nom", "Produit inconnu")
            product_id = product.get("id", "N/A")

            reply_text = (
                f"👍 Bien reçu ! Votre intérêt pour les croquettes \"<b>{product_name}</b>\" "
                f"(ID: {product_id}) a été enregistré.\n"
                "Nous vous contacterons bientôt si nécessaire !"
            )

            # === Ici, vous pourriez ajouter du code pour ===
            # 1. Enregistrer la demande quelque part (fichier, base de données...)
            # 2. Envoyer une notification au propriétaire du bot (par ex. via un autre message Telegram)
            # Exemple: await context.bot.send_message(chat_id=ID_ADMIN, text=f"Nouvel intérêt commande de {user.username} pour {product_name}")
            # =============================================

    except json.JSONDecodeError:
        logger.error(f"Erreur: Impossible de décoder le JSON reçu de la WebApp: {data_str}")
        reply_text = "Oups, un problème est survenu lors de la réception des informations du catalogue."
    except Exception as e:
        logger.error(f"Erreur inattendue lors du traitement des données WebApp: {e}")
        reply_text = "Une erreur inattendue est survenue."

    # Envoyer une réponse à l'utilisateur dans Telegram
    await update.message.reply_text(text=reply_text, parse_mode=ParseMode.HTML)


# === Fonction Principale (main) ===
def main():
    """Configure et lance le bot."""
    logger.info("Vérification du token...")
    if not TOKEN:
        logger.critical("Token non trouvé. Le bot ne peut pas démarrer.")
        return # Arrêter si pas de token

    logger.info("Configuration de l'application Telegram...")
    application = Application.builder().token(TOKEN).build()

    # Ajouter les gestionnaires de commandes et callbacks
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CallbackQueryHandler(show_info_callback, pattern='^show_info$'))

    # Ajouter le gestionnaire pour les données de la Web App
    # Il écoute les messages qui contiennent des données de web_app
    application.add_handler(MessageHandler(filters.StatusUpdate.WEB_APP_DATA, web_app_data_handler))

    # Lancer le bot
    logger.info("Le bot Python démarre...")
    application.run_polling()
    logger.info("Le bot Python est arrêté.")


if __name__ == "__main__":
    main()