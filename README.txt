# CSCI497_LukeDuell_FinalProject

This program utilizes firebase firestore, firebase auth with a local server, node.js, and some other smaller services. The purpose of this program is to provide a consumer the ability to track information in their system. The purpose of the local server is just to be able to run the project localy as a test. You do not need anything to be installed to run the program. 

# Running the Program

To run the program, unzip the project folder and open the folder that was unzipped. Run the start.bat file which will run the server on localhost:3000 you will be asked if you want to allow node.js to access, click allow. Open a browser and type in localhost:3000 this will open the login screen. Below is an example email and password that can be used to login to the service.

Admin:
Email: lukeduell@gmail.com
Password: Testingtesting

User:
Email: b@gmail.com
Password: Testingtesting

Customer:
Email: a@gmail.com
Password: Testingtesting

If you would like, you can also create an account. I would suggest NOT doing this because your access will be limited. 

Once you are logged in you will directed to the list screen which has all the items in the database that have been saved. There are a lot of options on this page, admin (only for admins), logout, add item, and if you want to edit an item you can click on any of them and it will take you to the edit screen.

The add item page will allow you to add an item to the database, this and the edit screen are a direct reflection of what fields the user have added in the admin page.

The admin page allows the user to add users, edit permissions, and delete users. It also allows for the users to change the fields that are displayed in the edit and add portion. This page is only accessable to users with admin access so I suggest running with the email and password provided above otherwise you will be limited.

