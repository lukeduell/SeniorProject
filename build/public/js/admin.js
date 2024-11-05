import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, getDoc, updateDoc, deleteDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged, getIdToken } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import firebaseConfig from './firebaseConfig.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

document.addEventListener('DOMContentLoaded', () => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        const idToken = await getIdToken(user, true);
        const response = await fetch('/users', {
          headers: {
            'Authorization': `Bearer ${idToken}`
          }
        });

        if (response.ok) {
          fetchFieldLabels();
          fetchUsers();
        } else {
          console.error('User is not authorized to access /users');
          window.location.href = 'index.html';
        }
      } catch (error) {
        console.error('Error fetching users:', error.message);
        window.location.href = 'index.html';
      }
    } else {
      window.location.href = 'index.html';
    }
  });

  document.getElementById('backBtn').addEventListener('click', () => {
    window.location.href = 'list.html';
  });
});

async function fetchFieldLabels() {
  try {
    const fieldsContainer = document.getElementById('fieldsContainer');
    fieldsContainer.innerHTML = ''; // Clear previous fields

    const docRef = doc(db, 'AdminFieldDB', 'AdminFields');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const fieldsData = docSnap.data();

      for (let i = 1; i <= 10; i++) {
        const fieldValue = fieldsData[`Field_${i}`] || '';
        const fieldLabel = document.createElement('label');
        const fieldInput = document.createElement('input');

        fieldLabel.for = `field_${i}`;
        fieldLabel.innerText = `Field ${i}`;
        fieldInput.id = `field_${i}`;
        fieldInput.name = `field_${i}`;
        fieldInput.type = 'text';
        fieldInput.value = fieldValue;

        fieldsContainer.appendChild(fieldLabel);
        fieldsContainer.appendChild(fieldInput);
        fieldsContainer.appendChild(document.createElement('br'));
      }
    } else {
      console.log('No such document!');
    }
  } catch (error) {
    console.error('Error fetching field labels:', error.message);
  }
}

document.getElementById('saveFieldsBtn').addEventListener('click', async () => {
  const updatedFields = {};
  for (let i = 1; i <= 10; i++) {
    const fieldInput = document.getElementById(`field_${i}`);
    updatedFields[`Field_${i}`] = fieldInput.value ? fieldInput.value : null;
  }

  try {
    const response = await fetch('/fields', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await auth.currentUser.getIdToken(true)}`
      },
      body: JSON.stringify(updatedFields)
    });

    if (response.ok) {
      alert('Fields updated and entries cleaned successfully!');
    } else {
      const errorText = await response.text();
      alert(`Error updating fields: ${errorText}`);
    }
  } catch (error) {
    console.error('Error updating fields:', error.message);
  }
});

async function fetchUsers() {
  const usersContainer = document.getElementById('usersContainer');
  usersContainer.innerHTML = ''; // Clear previous user list

  try {
    const response = await fetch('/users', {
      headers: {
        'Authorization': `Bearer ${await auth.currentUser.getIdToken(true)}`
      }
    });
    const users = await response.json();

    users.forEach((user) => {
      const uid = user.uid;
      const email = user.email;
      const role = user.role;

      const userDiv = document.createElement('div');
      userDiv.classList.add('user-item');

      const uidSpan = document.createElement('span');
      uidSpan.textContent = `Email: ${email} (UID: ${uid})`;

      const roleSelect = document.createElement('select');
      roleSelect.innerHTML = `
        <option value="admin" ${role === 'admin' ? 'selected' : ''}>Admin</option>
        <option value="user" ${role === 'user' ? 'selected' : ''}>User</option>
        <option value="customer" ${role === 'customer' ? 'selected' : ''}>Customer</option>
      `;

      const saveButton = document.createElement('button');
      saveButton.textContent = 'Save';
      saveButton.addEventListener('click', () => updateUserRole(uid, roleSelect.value));

      const deleteButton = document.createElement('button');
      deleteButton.textContent = 'Remove';
      deleteButton.addEventListener('click', () => removeUser(uid));

      userDiv.appendChild(uidSpan);

      if (auth.currentUser.uid !== uid) { // Prevent changing own role
        userDiv.appendChild(roleSelect);
        userDiv.appendChild(saveButton);
        userDiv.appendChild(deleteButton);
      } else {
        const roleSpan = document.createElement('span');
        roleSpan.textContent = `Role: ${role}`;
        userDiv.appendChild(roleSpan);
      }

      usersContainer.appendChild(userDiv);
    });
  } catch (error) {
    console.error('Error fetching users:', error.message);
  }
}

async function fetchUsersAfterAdd() {
  const usersContainer = document.getElementById('usersContainer');
  usersContainer.innerHTML = ''; // Clear previous user list

  try {
    const querySnapshot = await getDocs(collection(db, 'UsersCollection'));
    querySnapshot.forEach((doc) => {
      const userData = doc.data();
      const uid = doc.id;
      const email = userData.email;
      const role = userData.role;

      const userDiv = document.createElement('div');
      userDiv.classList.add('user-item');

      const uidSpan = document.createElement('span');
      uidSpan.textContent = `Email: ${email} (UID: ${uid})`;

      const roleSelect = document.createElement('select');
      roleSelect.innerHTML = `
        <option value="admin" ${role === 'admin' ? 'selected' : ''}>Admin</option>
        <option value="user" ${role === 'user' ? 'selected' : ''}>User</option>
        <option value="customer" ${role === 'customer' ? 'selected' : ''}>Customer</option>
      `;

      const saveButton = document.createElement('button');
      saveButton.textContent = 'Save';
      saveButton.addEventListener('click', () => updateUserRole(uid, roleSelect.value));

      const deleteButton = document.createElement('button');
      deleteButton.textContent = 'Remove';
      deleteButton.addEventListener('click', () => removeUser(uid));

      userDiv.appendChild(uidSpan);
      userDiv.appendChild(roleSelect);
      userDiv.appendChild(saveButton);
      userDiv.appendChild(deleteButton);

      usersContainer.appendChild(userDiv);
    });
  } catch (error) {
    console.error('Error fetching users:', error.message);
  }
}

async function updateUserRole(uid, newRole) {
  try {
    const userDoc = doc(db, 'UsersCollection', uid);
    await updateDoc(userDoc, { role: newRole });
    alert('User role updated successfully!');
  } catch (error) {
    console.error('Error updating user role:', error.message);
  }
}

async function removeUser(uid) {
  try {
    const idToken = await auth.currentUser.getIdToken(true);
    const response = await fetch(`/deleteUser/${uid}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${idToken}`
      }
    });

    if (response.ok) {
      alert('User removed successfully!');
      fetchUsers(); // Refresh the user list
    } else {
      const errorText = await response.text();
      console.error(`Error removing user: ${errorText}`);
      alert(`Error removing user: ${errorText}`);
    }
  } catch (error) {
    console.error('Error removing user:', error.message);
    alert(`Error removing user: ${error.message}`);
  }
}

document.getElementById('addUserBtn').addEventListener('click', async () => {
  const newUserEmail = document.getElementById('newUserEmail').value;
  const newUserPassword = document.getElementById('newUserPassword').value;

  try {
    const idToken = await auth.currentUser.getIdToken(true);
    const response = await fetch('/addUser', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify({ email: newUserEmail, password: newUserPassword })
    });

    if (response.ok) {
      console.log(`New user added with Email: ${newUserEmail}`);
      alert('User added successfully!');
      fetchUsersAfterAdd(); // Fetch users without checking credentials
    } else {
      const errorText = await response.text();
      console.error(`Error adding user: ${errorText}`);
      alert(`Error adding user: ${errorText}`);
    }
  } catch (error) {
    console.error('Error adding user:', error.message);
    alert(`Error adding user: ${error.message}`);
  }
});
