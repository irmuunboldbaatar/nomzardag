import { db } from './firebase-config.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

const urlParams = new URLSearchParams(window.location.search);
const bookId = urlParams.get('id');

async function loadProductDetails() {
    if (!bookId) return;

    // Fetch single document by ID from Firebase
    const docRef = doc(db, "books", bookId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        const book = docSnap.data();
        document.getElementById('product-detail-content').innerHTML = `
            <div class="product-container">
                <div class="main-img">
                    <img src="${book.image}" style="height:400px; object-fit: contain;">
                </div>
                <div class="product-specs">
                    <h1>${book.title || "Мэдээлэлгүй"}</h1>
                    <p class="author">Зохиогч: ${book.author || 'Тодорхойгүй'}</p>
                    <div class="price-tag">${book.price || 0}₮</div>
                    <div class="detail-grid">
                        <div class="spec-item"><strong>Анги:</strong> ${book.grade}</div>
                        <div class="spec-item"><strong>Хичээл:</strong> ${book.subject}</div>
                        <div class="spec-item"><strong>Хэвлэгдсэн:</strong> ${book.year} он</div>
                    </div>
                    <button class="buy-btn large" style="width:100%; margin-top:20px; background: #4f46e5; color: white;">Холбоо барих</button>
                </div>
            </div>
        `;
        const sellerDoc = await getDoc(doc(db, "users", book.sellerId));
        const seller = sellerDoc.data();

        const contactHTML = `
        <div class="contact-section">
            <h3>Contact Seller</h3>
            <a href="tel:${seller.phone}" class="contact-btn phone">📞 Call: ${seller.phone}</a>
            ${seller.fb ? `<a href="${seller.fb}" target="_blank" class="contact-btn fb">Facebook</a>` : ''}
            ${seller.ig ? `<a href="https://instagram.com/${seller.ig}" target="_blank" class="contact-btn ig">Instagram</a>` : ''}
        </div>
    `;
        // Handle history
        updateHistory({ id: bookId, ...book });
    } else {
        document.getElementById('product-detail-content').innerHTML = "<h2>Ном олдсонгүй.</h2>";
    }
}

// Note: Change product.html script tag to type="module" to allow imports
loadProductDetails();

// ... (Keep your updateHistory and renderHistory functions below) ...

function updateHistory(book) {
    let history = JSON.parse(localStorage.getItem('recentBooks')) || [];
    // Remove if already exists, then add to front
    history = history.filter(item => item.id !== book.id);
    history.unshift(book);
    if (history.length > 4) history.pop();

    localStorage.setItem('recentBooks', JSON.stringify(history));
    renderHistory(history);
}

function renderHistory(history) {
    const grid = document.getElementById('historyGrid');
    grid.innerHTML = history.map(b => `
        <div class="mini-card">
            <a href="product.html?id=${b.id}">
                <img src="${b.image}" width="100px" class="mini-img">
                <p>${b.title}</p>
            </a>
        </div>
    `).join('');
}