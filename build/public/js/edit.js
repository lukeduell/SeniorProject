import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, updateDoc, getDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { Timestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL, listAll, deleteObject } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";
import firebaseConfig from './firebaseConfig.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

const urlParams = new URLSearchParams(window.location.search);
const entryId = urlParams.get('id');

onAuthStateChanged(auth, (user) => {
  if (user) {
    if ((auth.currentUser.email.endsWith("@gmail.com") ? "employee" : "customer") == 'employee') {
      fetchFieldLabels().then(() => {
        fetchEntryDetails(entryId);
      });
    }
  } else {
    window.location.href = "index.html";
  }
});

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
        }
      }
    } else {
      console.log('No such document!');
    }
  } catch (error) {
    console.error('Error fetching field labels:', error.message);
  }
}

async function fetchEntryDetails(entryId) {
  try {
    const docRef = doc(db, 'CustomerCollection', entryId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const entryData = docSnap.data();
      const formContainer = document.getElementById('editForm');

      for (let i = 1; i <= 10; i++) {
        const fieldName = fieldLabels[`Field_${i}`];
        const fieldValue = entryData[`Field_${i}`] || '';

        if (fieldName) {
          const fieldLabel = document.createElement('label');
          const fieldInput = document.createElement('input');

          fieldLabel.for = `field_${i}`;
          fieldLabel.innerText = fieldName;
          fieldInput.id = `field_${i}`;
          fieldInput.name = `field_${i}`;

          if (i === 1) {
            fieldInput.type = 'date';
            fieldInput.value = fieldValue ? formatDate(new Date(fieldValue.seconds * 1000)) : '';
          } else {
            fieldInput.type = 'text';
            fieldInput.value = fieldValue;
          }

          formContainer.insertBefore(fieldLabel, formContainer.firstChild);
          formContainer.insertBefore(fieldInput, formContainer.firstChild);
          formContainer.insertBefore(document.createElement('br'), formContainer.firstChild);
          formContainer.insertBefore(document.createElement('br'), formContainer.firstChild);
        }
      }
    } else {
      console.log('No such document!');
    }
  } catch (error) {
    console.error('Error fetching entry details:', error.message);
  }
}

document.getElementById('editForm').addEventListener('submit', async function(event) {
  event.preventDefault();

  toggleLoadingScreen(true);

  const formData = {};
  for (let i = 1; i <= 10; i++) {
    const fieldInput = document.getElementById(`field_${i}`);
    if (fieldInput) {
      if (i === 1) {
        const dateArrivedInput = fieldInput.value;
        const timeArrivedInput = formatCurrentTime();
        const combinedDateTime = new Date(`${dateArrivedInput}T${timeArrivedInput}`);
        formData[`Field_${i}`] = Timestamp.fromDate(new Date(combinedDateTime));
      } else {
        formData[`Field_${i}`] = fieldInput.value;
      }
    }
  }

  try {
    const docRef = doc(db, 'CustomerCollection', entryId);
    await updateDoc(docRef, formData);

    // const fileList = document.getElementById('newImageInput').files;
    // await uploadNewImages(docRef.id, fileList);

    window.location.href = 'list.html';
  } catch (error) {
    console.error('Error updating document:', error);
    document.getElementById('errorText').style.display = 'block';
  } finally {
    toggleLoadingScreen(false);
  }
});

// async function uploadNewImages(entryId, fileList) {
//   const storageRef = ref(storage, `${entryId}`);

//   // Fetch existing image count
//   const existingImages = await listAll(storageRef);
//   const imageCount = existingImages.items.length;

//   for (let i = 0; i < fileList.length; i++) {
//     const file = fileList[i];
//     const imageName = `${imageCount + i}`;

//     const imageRef = ref(storageRef, imageName);

//     try {
//       await uploadBytes(imageRef, file);
//       console.log(`New Image ${i + 1} uploaded successfully.`);
//     } catch (error) {
//       console.error(`Error uploading new image ${i + 1}:`, error);
//     }
//   }
// }

// async function deleteAllImages(entryId) {
//   const storageRef = ref(storage, entryId);

//   try {
//     const listResult = await listAll(storageRef);
//     const items = listResult.items;

//     const deletePromises = items.map(async (item) => {
//       await deleteObject(item);
//       console.log('Image deleted:', item.name);
//     });

//     await Promise.all(deletePromises);
//     console.log('All images deleted.');
//     fetchAndDisplayImages(entryId);
//   } catch (error) {
//     console.error('Error deleting images:', error);
//   }
// }

document.getElementById('deleteBtn').addEventListener('click', deleteEntry);

async function deleteEntry() {
  try {
    const docRef = doc(db, 'CustomerCollection', entryId);
    await deleteDoc(docRef);
    window.location.href = 'list.html';
  } catch (error) {
    console.error('Error deleting document: ', error);
    document.getElementById('deleteErrorText').style.display = 'block';
  }
}

// window.addEventListener('DOMContentLoaded', () => {
//   fetchAndDisplayImages(entryId);
// });

// async function fetchAndDisplayImages(entryId) {
//   const storageRef = ref(storage, entryId);
//   const imageGrid = document.getElementById('imageGrid');
//   imageGrid.innerHTML = '';

//   try {
//     const listResult = await listAll(storageRef);
//     const items = listResult.items;

//     for (let i = 0; i < items.length; i++) {
//       const imageRef = items[i];
//       const imageURL = await getDownloadURL(imageRef);

//       const imageContainer = document.createElement('div');
//       imageContainer.className = 'image-container';

//       const img = document.createElement('img');
//       img.src = imageURL;
//       img.onclick = () => openFullScreen(imageURL);
//       imageContainer.appendChild(img);

//       imageGrid.appendChild(imageContainer);
//     }
//   } catch (error) {
//     console.error('Error fetching images:', error);
//   }
// }

function openFullScreen(imageURL) {
  const fullScreenWindow = window.open(imageURL, '_blank');
  if (fullScreenWindow) {
    fullScreenWindow.focus();
  } else {
    alert('Please allow pop-ups to view full-screen images.');
  }
}

function toggleLoadingScreen(visible) {
  const loadingOverlay = document.getElementById('loadingOverlay');
  loadingOverlay.style.display = visible ? 'block' : 'none';
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatCurrentTime() {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}
