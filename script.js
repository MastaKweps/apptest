document.addEventListener('DOMContentLoaded', function() {
    const productGrid = document.getElementById('product-grid');
    let tg = null; // Variable pour l'objet Telegram WebApp

    // --- Initialisation de Telegram WebApp ---
    if (window.Telegram && window.Telegram.WebApp) {
        tg = window.Telegram.WebApp;
        tg.ready(); // Indiquer que l'app est prête

        console.log("Telegram WebApp Initialized.");
        // Adapter les couleurs du body (optionnel, le CSS le fait déjà avec les variables)
        // document.body.style.backgroundColor = tg.themeParams.bg_color || '#ffffff';
        // document.body.style.color = tg.themeParams.text_color || '#000000';

        // Vous pouvez configurer le bouton principal si besoin
        // tg.MainButton.setText('Voir les détails');
        // tg.MainButton.hide(); // Cacher par défaut

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
                productGrid.innerHTML = '<p style="color: red;">Erreur lors du chargement des produits.</p>';
            }
        });

    // --- Fonction pour afficher les produits ---
    function displayProducts(products) {
        productGrid.innerHTML = ''; // Vider la grille au cas où

        products.forEach(product => {
            // Créer la carte produit (div)
            const card = document.createElement('div');
            card.className = 'product-card';
            card.setAttribute('data-product-id', product.id); // Stocker l'ID produit

            // Créer l'image
            const img = document.createElement('img');
            img.src = product.photo;
            img.alt = product.nom; // Texte alternatif pour l'accessibilité

            // Créer le titre (nom)
            const name = document.createElement('h4');
            name.textContent = product.nom;

            // Créer la description
            const desc = document.createElement('p');
            desc.textContent = product.desc;

            // Ajouter les éléments à la carte
            card.appendChild(img);
            card.appendChild(name);
            card.appendChild(desc);

            // Ajouter un écouteur d'événement pour quand on clique sur une carte
            card.addEventListener('click', function() {
                handleProductClick(product);
            });

            // Ajouter la carte à la grille
            productGrid.appendChild(card);
        });
    }

    // --- Fonction pour gérer le clic sur un produit ---
    function handleProductClick(product) {
        console.log("Clicked product:", product);

        // Ici, vous pouvez décider quoi faire :
        // 1. Afficher plus de détails dans l'app elle-même (plus complexe)
        // 2. Envoyer l'ID du produit au bot Python
        // 3. Afficher un bouton principal Telegram pour une action

        if (tg) { // Vérifier si l'API Telegram est dispo
            // Exemple: Afficher une alerte Telegram simple
            // tg.showAlert(`Vous avez cliqué sur : ${product.nom}`);

            // Exemple: Envoyer l'ID au bot (si le bot est configuré pour écouter)
            // tg.sendData(JSON.stringify({ action: 'view_product', productId: product.id }));

            // Exemple: Afficher le bouton principal pour commander ce produit
            tg.MainButton.setText(`Commander ${product.nom}`);
            tg.MainButton.show();
            // Définir ce qui se passe quand on clique sur le bouton principal
            // Important: Il faut d'abord enlever l'ancien listener s'il y en a un
            tg.MainButton.offClick(mainButtonClicked); // Enlever listener précédent
            tg.MainButton.onClick(mainButtonClicked);  // Ajouter nouveau listener

            // Stocker le produit sélectionné pour l'utiliser dans le handler du bouton
            window.selectedProduct = product;

        } else {
            alert(`Vous avez cliqué sur : ${product.nom}`); // Fallback pour navigateur simple
        }
    }

     // --- Fonction appelée quand le bouton principal Telegram est cliqué ---
     function mainButtonClicked() {
        if (window.selectedProduct && tg) {
            const product = window.selectedProduct;
            console.log("Main button clicked for product:", product);
            // Envoyer des données au bot (par exemple l'ID du produit à commander)
            tg.sendData(JSON.stringify({ action: 'order_product', product: product }));

            // Optionnel : fermer la Mini App après l'action
            // tg.close();
        }
     }

}); // Fin de DOMContentLoaded