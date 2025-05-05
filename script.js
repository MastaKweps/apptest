// script.js - Version Complète et Corrigée

document.addEventListener('DOMContentLoaded', function() {
    // Récupérer les éléments principaux du DOM
    const productGrid = document.getElementById('product-grid');
    const productDetailView = document.getElementById('product-detail-view');
    const backButton = document.getElementById('back-button');

    // Variable globale pour l'objet Telegram WebApp
    let tg = null;
    // Variable globale pour stocker le produit sélectionné (utilisé par handleOrderClick via le bouton détail)
    window.selectedProductForDetail = null;

    // --- Initialisation de Telegram WebApp ---
    if (window.Telegram && window.Telegram.WebApp) {
        tg = window.Telegram.WebApp;
        tg.ready(); // Indiquer que l'app est prête
        console.log("Telegram WebApp Initialized.");

        // Optionnel: Adapter les couleurs du body via JS (le CSS le fait déjà avec les variables)
        // document.body.style.backgroundColor = tg.themeParams.bg_color || '#ffffff';
        // document.body.style.color = tg.themeParams.text_color || '#000000';

        // Cacher le bouton principal par défaut car on utilise un bouton dans la vue détail
         tg.MainButton.hide();

    } else {
        console.warn("Telegram WebApp API not found. Running in browser?");
    }

    // --- Chargement des produits depuis JSON ---
    fetch('products.json')
        .then(response => {
            // Vérifier si la requête a réussi
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json(); // Convertir la réponse en JSON
        })
        .then(products => {
            // Vérifier si la grille existe avant d'ajouter des produits
            if (productGrid) {
                displayProducts(products); // Appeler la fonction pour afficher les produits
            } else {
                console.error("Element with ID 'product-grid' not found.");
            }
        })
        .catch(error => {
            console.error('Error fetching or parsing products.json:', error);
            if (productGrid) {
                // Afficher l'erreur dans la grille si elle existe
                productGrid.innerHTML = '<p style="color: red; text-align: center;">Erreur lors du chargement des produits.</p>';
            }
        });

    // --- Gestion du bouton Retour ---
    if (backButton) {
        backButton.addEventListener('click', function() {
            // Cacher la vue détail et afficher la grille
            if (productDetailView) productDetailView.style.display = 'none';
            if (productGrid) productGrid.style.display = 'grid'; // Remettre l'affichage grille

            // Cacher le bouton principal de Telegram s'il était affiché (normalement non ici)
             if (tg) {
                 tg.MainButton.hide();
             }
             // Nettoyer le produit sélectionné
             window.selectedProductForDetail = null;
        });
    } else {
        console.error("Back button (#back-button) not found in HTML.");
    }

}); // --- Fin de l'écouteur DOMContentLoaded ---


// --- Fonction pour afficher les produits dans la grille ---
function displayProducts(products) {
    const productGrid = document.getElementById('product-grid'); // Assurer d'avoir la référence
    if (!productGrid) return; // Sortir si la grille n'existe pas

    productGrid.innerHTML = ''; // Vider la grille

    products.forEach(product => {
        // Créer la carte produit (div principale)
        const card = document.createElement('div');
        card.className = 'product-card';
        card.setAttribute('data-product-id', product.id); // Stocker l'ID

        // Créer l'image
        const img = document.createElement('img');
        img.src = product.photo;
        img.alt = product.nom;
        img.loading = 'lazy'; // Chargement différé des images

        // Créer le conteneur pour le texte
        const infoDiv = document.createElement('div');
        infoDiv.className = 'product-info';

        // Créer le titre (nom)
        const name = document.createElement('h4');
        name.textContent = product.nom;

        // Créer la description
        const desc = document.createElement('p');
        desc.textContent = product.desc;

        // Ajouter le nom et la description à la div infoDiv
        infoDiv.appendChild(name);
        infoDiv.appendChild(desc);

        // Ajouter l'image et la div d'info à la carte principale
        card.appendChild(img);
        card.appendChild(infoDiv);

        // Ajouter un écouteur d'événement pour quand on clique sur une carte
        card.addEventListener('click', function() {
            handleProductClick(product); // Passer l'objet produit complet
        });

        // Ajouter la carte à la grille
        productGrid.appendChild(card);
    });
}


// --- Fonction appelée quand on clique sur une carte produit ---
function handleProductClick(product) {
    console.log("Clicked product:", product);

    // Récupérer les éléments de la vue principale et détail (on le refait ici au cas où)
    const productGrid = document.getElementById('product-grid');
    const productDetailView = document.getElementById('product-detail-view');

    if (!productDetailView || !productGrid) {
        console.error("Detail view or grid view not found in DOM");
        return;
    }

    // Récupérer les éléments *à l'intérieur* de la vue détail
    const detailName = document.getElementById('detail-product-name');
    const detailPhoto = document.getElementById('detail-product-photo');
    const detailVideoContainer = document.getElementById('detail-product-video-container');
    const detailDesc = document.getElementById('detail-product-desc');
    const detailSizesList = document.getElementById('detail-product-sizes');
    const detailOrderButton = document.getElementById('detail-order-button');

    // --- Remplir les éléments avec les données du produit ---
    if (detailName) detailName.textContent = product.nom;
    if (detailPhoto) {
        detailPhoto.src = product.photo;
        detailPhoto.alt = product.nom;
    }
    if (detailDesc) detailDesc.textContent = product.desc;

    // --- Gérer la vidéo (Logique Corrigée) ---
    if (detailVideoContainer) {
        detailVideoContainer.innerHTML = ''; // Vider le conteneur avant d'ajouter
        detailVideoContainer.style.display = 'none'; // Cacher par défaut
        detailVideoContainer.style.paddingBottom = '56.25%'; // Réinitialiser padding pour ratio
        detailVideoContainer.style.height = '0'; // Réinitialiser hauteur

        if (product.videoUrl) {
            let videoId = null;
            let isYouTube = false;

            try {
                const url = new URL(product.videoUrl);
                if (url.hostname.includes('youtube.com') || url.hostname.includes('youtu.be')) {
                     if (url.pathname === '/watch') {
                         videoId = url.searchParams.get('v');
                     } else if (url.pathname.startsWith('/embed/')) {
                         videoId = url.pathname.substring('/embed/'.length);
                     } else if (url.hostname === 'youtu.be') {
                        videoId = url.pathname.substring(1);
                    }
                    isYouTube = !!videoId; // Vrai si on a trouvé un ID
                }
            } catch (e) {
                console.warn("URL Vidéo invalide ou non-YouTube:", product.videoUrl, e);
                isYouTube = false;
            }

            if (isYouTube && videoId) { // C'est YouTube
                console.log("Embedding YouTube video ID:", videoId);
                const iframe = document.createElement('iframe');
                iframe.src = `https://www.youtube-nocookie.com/embed/${videoId}`;
                iframe.frameborder = "0";
                iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
                iframe.allowfullscreen = true;
                detailVideoContainer.appendChild(iframe);
                detailVideoContainer.style.display = 'block';

            } else { // Essayer comme vidéo directe
                console.log("Attempting to embed direct video:", product.videoUrl);
                const video = document.createElement('video');
                video.src = product.videoUrl;
                video.controls = true;
                video.playsinline = true;
                video.style.maxWidth = '100%';
                video.onerror = () => {
                     console.error("Error loading video:", product.videoUrl);
                     detailVideoContainer.innerHTML = '<p style="color: orange; padding: 10px;">Impossible de charger la vidéo.</p>';
                     detailVideoContainer.style.display = 'block';
                     detailVideoContainer.style.paddingBottom = '0';
                     detailVideoContainer.style.height = 'auto';
                };
                 // Si la vidéo se charge, on l'affiche
                video.onloadeddata = () => {
                     detailVideoContainer.style.display = 'block';
                };
                detailVideoContainer.appendChild(video);
                // On met display:block ici aussi, si jamais onerror n'est pas immédiat
                // mais si la vidéo n'est pas valide du tout, onerror devrait le gérer.
                 detailVideoContainer.style.display = 'block';
            }
        }
         // Si videoUrl était vide ou null dès le départ, le conteneur reste caché (display = 'none')
    }

    // --- Gérer les tailles ---
    if (detailSizesList) {
        detailSizesList.innerHTML = ''; // Vider la liste
        if (product.tailles && Array.isArray(product.tailles) && product.tailles.length > 0) {
            product.tailles.forEach(taille => {
                const li = document.createElement('li');
                li.textContent = taille;
                detailSizesList.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.textContent = "Taille non spécifiée";
            detailSizesList.appendChild(li);
        }
    }

    // --- Gérer le bouton Commander dans la vue détail ---
    if (detailOrderButton) {
        detailOrderButton.textContent = `Commander ${product.nom}`; // Mettre à jour le texte du bouton
        // Stocker le produit courant pour le retrouver dans le handler
        window.selectedProductForDetail = product;

        // Technique propre pour (re)attacher le listener SANS doublons :
        // 1. Cloner le bouton (cela enlève les anciens listeners)
        const newButton = detailOrderButton.cloneNode(true);
        // 2. Remplacer l'ancien bouton par le nouveau dans le DOM
        detailOrderButton.parentNode.replaceChild(newButton, detailOrderButton);
        // 3. Attacher le listener au nouveau bouton
        newButton.addEventListener('click', () => {
            // Utilise la variable globale mise à jour
            if(window.selectedProductForDetail) {
                 handleOrderClick(window.selectedProductForDetail);
            } else {
                 console.error("Aucun produit sélectionné au moment du clic sur Commander");
            }
        });

    } else {
        console.error("Order button (#detail-order-button) not found in HTML.");
    }

    // --- Afficher la vue détail et cacher la grille ---
    if (productGrid) productGrid.style.display = 'none';
    if (productDetailView) productDetailView.style.display = 'block';

    // Faire défiler vers le haut de la vue détail pour une meilleure expérience
    if (productDetailView) {
        productDetailView.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Assurer que le MainButton de Telegram est caché
    if(tg) {
        tg.MainButton.hide();
    }
}


// --- Fonction appelée par le clic sur le bouton "Commander" DANS la vue détail ---
function handleOrderClick(product) {
    // Vérifier si l'objet tg (Telegram WebApp) est disponible
    const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;

    console.log("Order button clicked for:", product);
    if (tg) {
        // Envoyer les données au bot Python (qui devra les gérer)
        tg.sendData(JSON.stringify({ action: 'order_product', product: product }));

        // Afficher une confirmation à l'utilisateur
        tg.showAlert(`Votre intérêt pour "${product.nom}" a été signalé au bot !`);

        // Optionnel : revenir à la grille après avoir commandé ?
        // const productGrid = document.getElementById('product-grid');
        // const productDetailView = document.getElementById('product-detail-view');
        // if (productDetailView) productDetailView.style.display = 'none';
        // if (productGrid) productGrid.style.display = 'grid';
        // tg.MainButton.hide();

        // Optionnel : Fermer la Mini App après l'action
        // tg.close();
    } else {
        // Fallback si l'API Telegram n'est pas dispo (ex: test dans navigateur standard)
        alert(`Simulation : Commande pour ${product.nom}`);
        console.log("Données qui seraient envoyées au bot :", JSON.stringify({ action: 'order_product', product: product }));
    }
}

// --- Fonction pour le bouton principal Telegram (peut être supprimée si non utilisée) ---
// Gardée ici pour référence si vous réactivez le MainButton ailleurs.
function mainButtonClicked() {
    // Important: cette fonction utilise une variable globale 'selectedProduct'
    // qui n'est plus mise à jour par handleProductClick.
    // Si vous réutilisez MainButton, il faudra adapter la logique pour savoir quel produit est concerné.
     const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
     // Hypothetical: Assume product is stored differently if MainButton is used
     // const product = window.someOtherWayToKnowSelectedProduct;
     // if (product && tg) {
     //     console.log("Main button clicked for product:", product);
     //     tg.sendData(JSON.stringify({ action: 'order_via_main_button', product: product }));
     // } else {
          console.warn("MainButton clicked but no selected product context found or Telegram API unavailable.");
     // }
 }