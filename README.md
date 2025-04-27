
# GetPet - Find Your Perfect Pet

**GetPet** is a web application that helps users discover adoptable pets and learn about different pet breeds. It uses the Petfinder API and The Dog API for real-time pet and breed data.

---

## Features
- Search Pets: Filter adoptable pets based on type, size, age, and gender.
- Detailed Pet Cards: View pets' images, breed info, age, gender, and description.
- Adopt Pets: Save pets to your adopted list (using browser local storage).
- Featured Dog Breeds: Learn about popular dog breeds with images.
- Responsive Design: Works seamlessly across desktop, tablet, and mobile devices.

---

## Project Structure
```
/
|-- api.js           # Handles Dog API integration
|-- index.html       # Main webpage
|-- script.js        # Frontend logic
|-- styles.css       # Styling (responsive & modern UI)
|-- server.js        # Express server for Petfinder API
|-- package.json     # Project dependencies & scripts
|-- .env             # Environment variables (hidden from upload)
```

---

## Tech Stack
- Frontend: HTML5, CSS3, Vanilla JavaScript
- Backend: Node.js, Express.js
- External APIs: 
  - Petfinder API
  - The Dog API

---

2. Install Server Dependencies
```bash
npm install
```

3. Create a `.env` File
Create a file named `.env` in your project root:
```bash
REACT_APP_DOG_API_KEY=********************************
PETFINDER_API_KEY=********************************
PETFINDER_SECRET=********************************
PORT=3000
```
Important: Never expose or commit your `.env` file. It contains sensitive API keys.

4. Run the Application
```bash
npm run dev
```
The server will start on:
```
http://localhost:3000
```

---

## API Integrations

- Petfinder API: 
  - Used for fetching real adoptable pets.
  - Requires client_id and client_secret.
  - Server fetches an access_token to authorize requests.

- The Dog API:
  - Used for displaying random featured dog breeds.
  - Requires a public API key (x-api-key).

---

## Future Enhancements
- User authentication and account management.
- Mark favorite pets.
- Improve error handling and offline support.
- Deploy a live version using Render or Railway.
- Expand to more animal types and advanced filtering.

---

## License
This project is licensed under the MIT License.

---

Thank you for visiting GetPet.
Built to help adorable pets find forever homes.

---

"Adopt. Don't Shop."
