import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import firebaseConfig from './firebaseConfig.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let sortByField = 'dateArrivedNewOld';
let currentPage = 1;
const itemsPerPage = 50;
let currentUserRole = null;

onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userDoc = await fetchUserRole(user.uid);
        currentUserRole = userDoc.role;
        if (['admin', 'user', 'customer'].includes(currentUserRole)) {
            fetchAllEntries();
            if (currentUserRole !== 'admin') {
                document.getElementById('admin-btn').style.display = 'none';
            }
        } else {
            window.location.href = "index.html";
        }
    } else {
        window.location.href = "index.html";
    }
});

async function fetchUserRole(uid) {
    const docRef = doc(db, 'UsersCollection', uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docSnap.data();
    } else {
        return { role: 'unknown' };
    }
}

let allEntries = [];
let fieldLabels = {};

async function fetchFieldLabels() {
    try {
        const docRef = doc(db, 'AdminFieldDB', 'AdminFields');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            for (let i = 1; i <= 10; i++) {
                const fieldName = docSnap.data()[`Field_${i}`];
                if (fieldName) {
                    fieldLabels[`Field_${i}`] = fieldName;
                } else {
                    delete fieldLabels[`Field_${i}`];
                }
            }
        } else {
            console.log('No such document!');
        }
    } catch (error) {
        console.error('Error fetching field labels:', error.message);
    }
}

async function fetchAllEntries() {
    await fetchFieldLabels();
    try {
        const querySnapshot = await getDocs(collection(db, 'CustomerCollection'));
        allEntries = [];
        querySnapshot.forEach((doc) => {
            allEntries.push({ id: doc.id, ...doc.data() });
        });
        sortEntries(allEntries);
    } catch (error) {
        console.error('Error fetching entries:', error.message);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('admin-btn').addEventListener('click', () => {
        window.location.href = 'admin.html';
    });
    document.getElementById('logout-btn').addEventListener('click', () => {
        signOut(auth).then(() => {
            window.location.href = "index.html";
        }).catch((error) => {
            console.error('Error signing out:', error.message);
        });
    });
});

function performSearch() {
    const searchQuery = document.getElementById('searchInput').value.trim().toLowerCase();
    let filteredEntries = allEntries;

    if (searchQuery !== '') {
        filteredEntries = allEntries.filter((entry) => {
            const name = entry.Field_2 ? entry.Field_2.toLowerCase() : '';
            return name.includes(searchQuery);
        });
    }

    sortEntries(filteredEntries);
}

function sortEntries(entries) {
    entries.sort((a, b) => {
        if (sortByField === 'nameAZ') {
            const nameA = a.Field_2 ? a.Field_2.toLowerCase() : '';
            const nameB = b.Field_2 ? b.Field_2.toLowerCase() : '';
            return nameA.localeCompare(nameB);
        } else if (sortByField === 'nameZA') {
            const nameA = a.Field_2 ? a.Field_2.toLowerCase() : '';
            const nameB = b.Field_2 ? a.Field_2.toLowerCase() : '';
            return nameB.localeCompare(nameA);
        } else if (sortByField === 'dateArrivedNewOld') {
            const dateA = a.Field_1 ? new Date(a.Field_1.seconds * 1000) : new Date(0);
            const dateB = b.Field_1 ? new Date(b.Field_1.seconds * 1000) : new Date(0);
            return dateB - dateA;
        }
        return 0;
    });

    displayEntries(entries);
}

async function displayEntries(entries, page = 1, itemsPerPage = 50) {
    const entryList = document.getElementById('entryList');
    entryList.innerHTML = '';

    try {
        const startIndex = (page - 1) * itemsPerPage;
        const paginatedEntries = entries.slice(startIndex, startIndex + itemsPerPage);

        paginatedEntries.forEach((entry) => {
            const listItem = document.createElement('li');
            const detailsContainer = document.createElement('div');
            detailsContainer.classList.add('details-container');
            listItem.appendChild(detailsContainer);

            for (let i = 1; i <= 10; i++) {
                const fieldKey = `Field_${i}`;
                let fieldValue = entry[fieldKey] || '';
                if (fieldLabels[fieldKey] && fieldValue) {
                    if (fieldKey === 'Field_1' && fieldValue) {
                        fieldValue = formatDate(new Date(fieldValue.seconds * 1000));
                    }
                    const span = document.createElement('span');
                    span.textContent = `${fieldLabels[fieldKey]}: ${fieldValue}`;
                    span.classList.add(`list-${fieldKey.toLowerCase()}`);
                    detailsContainer.appendChild(span);
                }
            }

            if (currentUserRole === 'admin' || currentUserRole === 'user') {
                listItem.classList.add('clickable');
                listItem.addEventListener('click', () => {
                    editEntry(entry.id);
                });
            }

            entryList.appendChild(listItem);
        });
    } catch (error) {
        console.error('Error displaying entries:', error.message);
    }
}

document.getElementById('sortBy').addEventListener('change', (event) => {
    sortByField = event.target.value;
    performSearch();
});

document.getElementById('searchInput').addEventListener('input', performSearch);

function formatDate(date) {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return new Intl.DateTimeFormat('en-US', options).format(date);
}
