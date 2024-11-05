import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { Timestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
//import { getStorage, ref, uploadBytes } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";
import firebaseConfig from './firebaseConfig.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
//const storage = getStorage(app);

onAuthStateChanged(auth, (user) => {
  if (user) {
    fetchAndDisplayFields();
  } else {
    window.location.href = "index.html";
  }
});

async function fetchAndDisplayFields() {
  const docRef = doc(db, 'AdminFieldDB', 'AdminFields');
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const fields = docSnap.data();
    const formContainer = document.getElementById('visitorForm');

    for (let i = 1; i <= 10; i++) {
      const fieldName = fields[`Field_${i}`];
      if (fieldName) {
        const fieldLabel = document.createElement('label');
        const fieldInput = document.createElement('input');
        
        fieldLabel.for = `field_${i}`;
        fieldLabel.innerText = fieldName;
        fieldInput.id = `field_${i}`;
        fieldInput.name = `field_${i}`;

        if (i === 1) {
          fieldInput.type = 'date';
          fieldInput.required = true;
        } else {
          fieldInput.type = 'text';
          fieldInput.required = i === 2;
        }

        formContainer.appendChild(fieldLabel);
        formContainer.appendChild(fieldInput);
        formContainer.appendChild(document.createElement('br'));
        formContainer.appendChild(document.createElement('br'));
      }
    }
  } else {
    console.log("No such document!");
  }
}

document.getElementById('visitorForm').addEventListener('submit', async function(event) {
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
    const docRef = await addDoc(collection(db, 'CustomerCollection'), formData);
    //const storageRef = ref(storage, `${docRef.id}`);
    //await uploadImages(storageRef);

    console.log('Document written with ID: ', docRef.id);
    document.getElementById('visitorForm').reset();
    window.location.href = 'list.html';
  } catch (error) {
    console.error('Error adding document: ', error);
    document.getElementById('errorText').style.display = 'block';
  } finally {
    toggleLoadingScreen(false);
  }
});

// async function uploadImages(storageRef) {
//   const fileInput = document.getElementById('fileInput');
//   const fileList = fileInput.files;

//   for (let i = 0; i < fileList.length; i++) {
//     const file = fileList[i];
//     const imageName = `image_${i}`;
//     const imageRef = ref(storageRef, imageName);

//     try {
//       await uploadBytes(imageRef, file);
//       console.log(`Image ${i + 1} uploaded successfully.`);
//     } catch (error) {
//       console.error(`Error uploading image ${i + 1}:`, error);
//     }
//   }
// }

function formatCurrentTime() {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

function toggleLoadingScreen(visible) {
  const loadingOverlay = document.getElementById('loadingOverlay');
  loadingOverlay.style.display = visible ? 'block' : 'none';
}

