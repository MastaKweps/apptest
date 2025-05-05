// script.js - Version Complète avec Filtres et Vue Détail (Fin Corrigée)

document.addEventListener('DOMContentLoaded', function() {
    // Références aux éléments DOM principaux
    const productGrid = document.getElementById('product-grid');
    const productDetailView = document.getElementById('product-detail-view');
    const backButton = document.getElementById('back-button');
    const categoryFilterButton = document.getElementById('category-filter-btn');
    const categoryListDropdown = document.getElementById('category-list');

    // Variables globales
    let tg = null; // Objet Telegram WebApp
    window.selectedProductForDetail = null; // Produit pour la vue détail/commande
    let allProducts = []; // Pour stocker tous les produits chargés
    let uniqueCategories = []; // Pour stocker les catégories uniques
    let currentFilterCategory = 'all'; // Filtre actif ('all' par défaut)

    // --- Initialisation de Telegram WebApp ---
    try {
        if (window.Telegram && window.Telegram.WebApp) {
            tg = window.Telegram.WebApp;
            tg.ready(); // Indiquer que l'app est prête
            tg.MainButton.hide(); // On n'utilise pas le bouton principal ici
            console.log("Telegram WebApp Initialized.");
            // Rendre le body visible maintenant que JS est prêt (évite flash de contenu)
            document.body.style.visibility = 'visible';
        } else {
            console.warn("Telegram WebApp API not found. Running in browser?");
            // Rendre visible même hors Telegram pour le test local
             document.body.style.visibility = 'visible';
        }
    } catch (e) {
        console.error("Error initializing Telegram WebApp:", e);
         document.body.style.visibility = 'visible'; // Assurer la visibilité en cas d'erreur
    }


    // --- Chargement des produits depuis JSON ---
    fetch('products.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(products => {
            if (!Array.isArray(products)) {
                 throw new Error("Le fichier JSON ne contient pas un tableau valide.");
            }
            allProducts = products;
            const categories = new Set(products.map(p => p.category).filter(Boolean));
            uniqueCategories = ['Toutes les catégories', ...categories].sort((a, b) => {
                if (a === 'Toutes les catégories') return -1;
                if (b === 'Toutes les catégories') return 1;
                return a.localeCompare(b);
            });

            populateCategoryDropdown();
            displayProducts(); // Afficher tous les produits par défaut
        })
        .catch(error => {
            console.error('Error fetching or parsing products.json:', error);
            if (productGrid) {
                productGrid.innerHTML = `<p style="color: red; text-align: center; grid-column: 1 / -1;">Erreur lors du chargement des produits (${error.message}). Vérifiez le fichier products.json.</p>`;
            }
        });

    // --- Gestion du bouton Filtre Catégorie ---
    if (categoryFilterButton && categoryListDropdown) {
        categoryFilterButton.addEventListener('click', function(event) {
            event.stopPropagation();
            const isVisible = categoryListDropdown.style.display === 'block';
            categoryListDropdown.style.display = isVisible ? 'none' : 'block';
        });
    } else {
         console.error("Filter button or category dropdown not found.");
    }

    // --- Fermer le dropdown si on clique ailleurs ---
    document.addEventListener('click', function(event) {
        if (categoryListDropdown && categoryFilterButton) {
            if (!categoryFilterButton.contains(event.target) && !categoryListDropdown.contains(event.target)) {
                categoryListDropdown.style.display = 'none';
            }
        }
    });

    // --- Gestion du bouton Retour de la vue détail ---
    if (backButton) {
        backButton.addEventListener('click', function() {
            if (productDetailView) productDetailView.style.display = 'none';
            if (productGrid) productGrid.style.display = 'grid';
            if (tg) tg.MainButton.hide();
            window.selectedProductForDetail = null;
        });
    } else {
        console.error("Back button (#back-button) not found.");
    }

    // --- Fonction pour remplir le dropdown des catégories ---
    function populateCategoryDropdown() {
        if (!categoryListDropdown) return;
        categoryListDropdown.innerHTML = '';

        uniqueCategories.forEach(category => {
            const item = document.createElement('div');
            item.className = 'category-item';
            item.textContent = category; // Le texte sera mis à jour par updateCategoryActiveState
            item.setAttribute('data-category', category === 'Toutes les catégories' ? 'all' : category);

            item.addEventListener('click', function() {
                const selectedCategoryValue = this.getAttribute('data-category');
                currentFilterCategory = selectedCategoryValue;

                if (categoryFilterButton) {
                     // Mettre à jour le texte du bouton filtre principal
                     categoryFilterButton.textContent = `${category} 🔄`;
                }
                categoryListDropdown.style.display = 'none'; // Fermer le dropdown
                displayProducts(); // Réafficher les produits filtrés
                updateCategoryActiveState(); // Mettre à jour l'indicateur visuel
            });
            categoryListDropdown.appendChild(item);
        });
         updateCategoryActiveState(); // Appeler une fois pour l'état initial (cocher "Toutes")
    }

     // --- Fonction pour mettre à jour l'état actif des catégories ---
     function updateCategoryActiveState() {
         if (!categoryListDropdown) return;
         const items = categoryListDropdown.querySelectorAll('.category-item');
         items.forEach(item => {
             const categoryValue = item.getAttribute('data-category');
             if(categoryValue === currentFilterCategory) {
                 item.classList.add('active');
                 item.textContent = categoryValue === 'all' ? '✓ Toutes les catégories' : categoryValue; // Utiliser categoryValue car category n'est pas défini ici
             } else {
                 item.classList.remove('active');
                  item.textContent = categoryValue === 'all' ? 'Toutes les catégories' : categoryValue; // Utiliser categoryValue
             }
         });
     }

    // --- Fonction pour afficher les produits dans la grille (avec filtre) ---
    function displayProducts() {
        if (!productGrid) {
            console.error("Product grid container not found for display.");
            return;
        }
        productGrid.innerHTML = ''; // Vider la grille

        const productsToDisplay = currentFilterCategory === 'all'
            ? allProducts
            : allProducts.filter(p => p.category === currentFilterCategory);

        if (productsToDisplay.length === 0) {
            productGrid.innerHTML = '<p style="text-align: center; grid-column: 1 / -1; padding: 20px;">Aucun produit trouvé pour cette catégorie.</p>';
            return;
        }

        productsToDisplay.forEach(product => {
            const card = document.createElement('div');
            card.className = 'product-card';
            card.setAttribute('data-product-id', product.id);

            const img = document.createElement('img');
            img.src = product.photo;
            img.alt = product.nom;
            img.loading = 'lazy';

            const infoDiv = document.createElement('div');
            infoDiv.className = 'product-info';

            const name = document.createElement('h4');
            name.textContent = product.nom;

            const desc = document.createElement('p');
            desc.textContent = product.desc;

            infoDiv.appendChild(name);
            infoDiv.appendChild(desc);
            card.appendChild(img);
            card.appendChild(infoDiv);

            card.addEventListener('click', function() {
                handleProductClick(product);
            });

            productGrid.appendChild(card);
        });
    }

    // --- Fonction appelée quand on clique sur une carte produit ---
    function handleProductClick(product) {
        const productGrid = document.getElementById('product-grid');
        const productDetailView = document.getElementById('product-detail-view');
        if (!productDetailView || !productGrid) { console.error("Detail/Grid view not found."); return; }

        const detailName = document.getElementById('detail-product-name');
        const detailPhoto = document.getElementById('detail-product-photo');
        const detailVideoContainer = document.getElementById('detail-product-video-container');
        const detailDesc = document.getElementById('detail-product-desc');
        const detailSizesList = document.getElementById('detail-product-sizes');
        const detailOrderButton = document.getElementById('detail-order-button');

        // Remplir
        if (detailName) detailName.textContent = product.nom;
        if (detailPhoto) { detailPhoto.src = product.photo; detailPhoto.alt = product.nom; }
        if (detailDesc) detailDesc.textContent = product.desc;

        // Gérer la vidéo
        if (detailVideoContainer) {
            detailVideoContainer.innerHTML = ''; detailVideoContainer.style.display = 'none';
            detailVideoContainer.style.paddingBottom = '56.25%'; detailVideoContainer.style.height = '0';
            if (product.videoUrl) {
                let videoId = null; let isYouTube = false;
                try {
                    const url = new URL(product.videoUrl);
                    if (url.hostname.includes('youtube.com') || url.hostname.includes('youtu.be')) {
                        if (url.pathname === '/watch') videoId = url.searchParams.get('v');
                        else if (url.pathname.startsWith('/embed/')) videoId = url.pathname.substring('/embed/'.length);
                        else if (url.hostname === 'youtu.be') videoId = url.pathname.substring(1);
                        isYouTube = !!videoId;
                    }
                } catch (e) { isYouTube = false; }

                if (isYouTube && videoId) {
                    const iframe = document.createElement('iframe');
                    iframe.src = `https://www.youtube-nocookie.com/embed/${videoId}`;
                    iframe.frameborder = "0"; iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"; iframe.allowfullscreen = true;
                    detailVideoContainer.appendChild(iframe); detailVideoContainer.style.display = 'block';
                } else {
                    const video = document.createElement('video');
                    video.src = product.videoUrl; video.controls = true; video.playsinline = true; video.style.maxWidth = '100%';
                    video.onerror = () => { detailVideoContainer.innerHTML = '<p style="color: orange; padding: 10px;">Impossible de charger la vidéo.</p>'; detailVideoContainer.style.paddingBottom = '0'; detailVideoContainer.style.height = 'auto'; };
                    video.onloadeddata = () => { detailVideoContainer.style.display = 'block'; };
                    detailVideoContainer.appendChild(video); detailVideoContainer.style.display = 'block';
                }
            }
        }

        // Gérer les tailles
        if (detailSizesList) {
            detailSizesList.innerHTML = '';
            if (product.tailles && Array.isArray(product.tailles) && product.tailles.length > 0) {
                product.tailles.forEach(taille => { const li = document.createElement('li'); li.textContent = taille; detailSizesList.appendChild(li); });
            } else { detailSizesList.innerHTML = '<li>Taille non spécifiée</li>'; }
        }

        // Gérer le bouton Commander
        if (detailOrderButton) {
            detailOrderButton.textContent = `Commander ${product.nom}`;
            window.selectedProductForDetail = product;
            const newButton = detailOrderButton.cloneNode(true);
            detailOrderButton.parentNode.replaceChild(newButton, detailOrderButton);
            newButton.addEventListener('click', () => { if(window.selectedProductForDetail) handleOrderClick(window.selectedProductForDetail); });
        }

        // Afficher/Cacher vues
        if (productGrid) productGrid.style.display = 'none';
        if (productDetailView) productDetailView.style.display = 'block';
        if (productDetailView) productDetailView.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if(tg) tg.MainButton.hide();
    }


    // --- Fonction appelée par le clic sur le bouton "Commander" DANS la vue détail ---
    function handleOrderClick(product) {
        const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
        console.log("Order button clicked for:", product);
        if (tg) {
            tg.sendData(JSON.stringify({ action: 'order_product', product: product }));
            tg.showAlert(`Votre intérêt pour "${product.nom}" a été signalé !`);
            // Optionnel: revenir à la grille ? Ou fermer ?
            // const productGrid = document.getElementById('product-grid');
            // const productDetailView = document.getElementById('product-detail-view');
            // if (productDetailView) productDetailView.style.display = 'none';
            // if (productGrid) productGrid.style.display = 'grid';
            // tg.close(); // Pour fermer la Mini App
        } else {
            alert(`Simulation : Commande pour ${product.nom}`);
            console.log("Data to send:", JSON.stringify({ action: 'order_product', product: product }));
        }
    }

    // --- Fonction pour le bouton principal Telegram (non utilisée activement ici) ---
    function mainButtonClicked() {
         const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
         console.warn("MainButton clicked - no specific context attached in this flow.");
     }

}); // --- FIN DE L'ECOUTEUR DOMContentLoaded ---