const $ = id => document.getElementById(id);
const fmt = n => n.toLocaleString("fr-FR") + " UGX";
const wa = txt => window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(txt)}`, "_blank");

/* ---------- Panier (mémorisé dans le navigateur) ---------- */
const getPanier = () => { try { return JSON.parse(localStorage.getItem("panier")) || []; } catch { return []; } };
const savePanier = p => { try { localStorage.setItem("panier", JSON.stringify(p)); } catch {} compteur(); };
function compteur() {
  const e = $("cart-count");
  if (e) e.textContent = getPanier().reduce((n, i) => n + i.qte, 0);
}
/* Page d'accueil : dépend de data.js (produits, WHATSAPP) et app.js (ajouter) */
(function () {
  if (!document.getElementById("hero-pics")) return;
  const $ = id => document.getElementById(id);
  const f = n => n.toLocaleString("fr-FR") + " UGX";
  const img = p => `<div class="h-img"><span>${p.emoji || "🛍️"}</span><img src="${p.img}" alt="${p.nom}" onerror="this.remove()"></div>`;

  // Remise affichée (en %) par id de produit : à modifier librement.
  // Le prix payé reste celui de data.js ; seul l'ancien prix barré est calculé.
  const PROMOS = { 1: 20, 3: 15, 5: 10, 7: 25, 9: 30, 10: 20 };

// Diaporama de la bannière : chaque cadre change d'image toutes les 3,5 s
const cadres = [0, 1, 2].map(i => produits.filter((p, k) => k % 3 === i));
$("hero-pics").innerHTML = cadres.map(liste =>
  `<div class="h-img slide">` +
  liste.map((p, k) => `<img class="${k === 0 ? "on" : ""}" src="${p.img}" alt="${p.nom}">`).join("") +
  `</div>`).join("");

document.querySelectorAll("#hero-pics .slide").forEach((cadre, i) => {
  const photos = cadre.querySelectorAll("img");
  if (photos.length < 2) return;
  let n = 0;
  setTimeout(() => setInterval(() => {
    photos[n].classList.remove("on");
    n = (n + 1) % photos.length;
    photos[n].classList.add("on");
  }, 2000), i * 1000);   // décalage : les 3 cadres ne changent pas en même temps
});

  // Coups de cœur
  $("top-picks").innerHTML = produits.map(p => {
    const r = PROMOS[p.id];
    const ancien = r ? Math.round(p.prix / (1 - r / 100) / 500) * 500 : 0;
    return `<div class="h-item">
      ${r ? `<span class="h-tag">-${r}%</span>` : ""}
      <a href="gallery.html?cat=${p.categorie}">${img(p)}</a>
      <h3>${p.nom}</h3>
      <div class="h-row">
        <div class="h-price">${f(p.prix)}${ancien ? `<s>${f(ancien)}</s>` : ""}</div>
        <button class="h-add" onclick="ajouter(${p.id})" aria-label="Ajouter ${p.nom} au panier">🛒</button>
      </div></div>`;
  }).join("");

  const piste = $("top-picks");
  $("h-next").onclick = () => piste.scrollBy({ left: 400 });
  $("h-prev").onclick = () => piste.scrollBy({ left: -400 });

  // Recherche -> galerie
  $("h-search").onsubmit = e => {
    e.preventDefault();
    location.href = "gallery.html?q=" + encodeURIComponent($("h-q").value.trim());
  };

  // Abonnement -> WhatsApp
  $("h-news-form").onsubmit = e => {
    e.preventDefault();
    const t = `Bonjour MURADHI, je veux recevoir vos nouveautés : ${$("h-mail").value}`;
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(t)}`, "_blank");
  };
})();
function toast(t) {
  const d = document.createElement("div");
  d.className = "toast"; d.textContent = t;
  document.body.appendChild(d);
  setTimeout(() => d.remove(), 1800);
}
function ajouter(id) {
  const p = getPanier(), i = p.find(x => x.id === id);
  i ? i.qte++ : p.push({ id, qte: 1 });
  savePanier(p);
  toast("Added to cart");
}

// Diaporama des cartes promo : les photos glissent vers la gauche
document.querySelectorAll(".pslide").forEach((piste, i) => {
  const n = piste.children.length;
  if (n < 2) return;
  let k = 0;
  setTimeout(() => setInterval(() => {
    k = (k + 1) % n;
    piste.style.transform = `translateX(-${k * 100}%)`;
  }, 3000), i * 800);
});

/* ---------- Carte produit ---------- */
const vignette = p => `
  <div class="thumb">
    <span>${p.emoji}</span>
    <img src="${p.img}" alt="${p.nom}" onerror="this.remove()">
  </div>`;
const carte = p => `
  <div class="card">
    <div onclick="ouvrir(${p.id})">${vignette(p)}</div>
    <div class="info">
      <h3>${p.nom}</h3>
      <p class="vend">${p.vendeur}</p>
      <p class="price">${fmt(p.prix)}</p>
      <button onclick="ajouter(${p.id})">Add to Cart</button>
    </div>
  </div>`;

/* ---------- GALLERY ---------- */
const grille = $("liste-produits");
if (grille) {
  let cat = new URLSearchParams(location.search).get("cat") || "tous", rech = "";
  const afficher = () => {
    const l = produits.filter(p => (cat === "tous" || p.categorie === cat) && p.nom.toLowerCase().includes(rech.toLowerCase()));
    grille.innerHTML = l.map(carte).join("") || "<p>No products found. Try another category.</p>";
  };
  const boutons = document.querySelectorAll(".filters button");
  boutons.forEach(b => {
    b.classList.toggle("active", b.dataset.cat === cat);
    b.onclick = () => { boutons.forEach(x => x.classList.remove("active")); b.classList.add("active"); cat = b.dataset.cat; afficher(); };
  });
  $("search").oninput = e => { rech = e.target.value; afficher(); };

  const modal = $("modal");
  window.ouvrir = id => {
    const p = produits.find(x => x.id === id);
    $("modal-contenu").innerHTML = `${vignette(p)}<h2>${p.nom}</h2>
      <p>Catégorie : ${p.categorie}. Vendu par <strong>${p.vendeur}</strong>.</p>
      <p class="price">${fmt(p.prix)}</p>
      <button onclick="ajouter(${p.id})">Add to Cart</button>`;
    modal.classList.add("open");
  };
  $("fermer").onclick = () => modal.classList.remove("open");
  modal.onclick = e => { if (e.target === modal) modal.classList.remove("open"); };
  afficher();
}

/* ---------- PANIER ---------- */
if ($("zone-panier")) {
  const zone = $("zone-panier");
  const rendre = () => {
    const panier = getPanier().filter(i => produits.some(p => p.id === i.id));
    let total = 0;
    zone.innerHTML = panier.map(i => {
      const p = produits.find(x => x.id === i.id);
      total += p.prix * i.qte;
      return `<div class="ligne">
        <div class="mini">${vignette(p)}</div>
        <div class="grow"><h3>${p.nom}</h3><p class="vend">${p.vendeur}</p><p class="price">${fmt(p.prix)}</p></div>
        <div class="qte"><button onclick="changer(${p.id},-1)">−</button><span>${i.qte}</span><button onclick="changer(${p.id},1)">+</button></div>
        <strong class="sous">${fmt(p.prix * i.qte)}</strong>
      </div>`;
    }).join("") || `<p>Your shopping cart is empty.</p>
    <p><a class="btn" href="gallery.html">Browse the gallery</a></p>`;
    $("total").textContent = fmt(total);
    $("bas-panier").hidden = !panier.length;
  };
  window.changer = (id, d) => {
    const p = getPanier(), i = p.find(x => x.id === id);
    i.qte += d;
    savePanier(p.filter(x => x.qte > 0));
    rendre();
  };
  $("vider").onclick = () => { savePanier([]); rendre(); };
  $("commander").onclick = () => {
    let total = 0;
    const lignes = getPanier().map(i => {
      const p = produits.find(x => x.id === i.id);
      total += p.prix * i.qte;
      return `- ${p.nom} x${i.qte} (${p.vendeur}) : ${fmt(p.prix * i.qte)}`;
    });
    wa(`Hello, MURADHI, I'd like to place an order :\n${lignes.join("\n")}\nTotal : ${fmt(total)}`);
  };
  rendre();
}

/* ---------- CONTACT ---------- */
if ($("form-contact")) $("form-contact").onsubmit = e => {
  e.preventDefault();
  wa(`Nom : ${$("nom").value}\nEmail : ${$("email").value}\nMessage : ${$("message").value}`);
};

/* ---------- DEVENIR VENDEUR ---------- */
if ($("form-vendeur")) $("form-vendeur").onsubmit = e => {
  e.preventDefault();
  wa(`Demande vendeur MURADHI\nBoutique : ${$("boutique").value}\nNom : ${$("vnom").value}\nTéléphone : ${$("tel").value}\nCatégorie : ${$("vcat").value}\nDescription : ${$("vdesc").value}`);
};

compteur();
