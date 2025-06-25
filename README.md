# SlateChat

[![Project Status](https://img.shields.io/badge/status-in__development-yellow)](https://github.com/yourusername/slatechat)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

> **SlateChat** is a modern, real-time chat application built with the MERN stack and Socket.IO. It offers secure user authentication, live messaging, and a responsive, user-friendly interface.

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Demo](#-demo)
- [Getting Started](#-getting-started)

  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running the Application](#running-the-application)

- [Usage](#-usage)
- [Folder Structure](#-folder-structure)
- [Contributing](#-contributing)
- [License](#-license)
- [Acknowledgements](#-acknowledgements)

---

## 🚀 Features

- **User Authentication**: Register and log in with JWT-based sessions.
- **Real-Time Messaging**: One-to-one chat powered by Socket.IO.
- **Online/Offline Indicators**: See who’s available at a glance.
- **Read Receipts**: Know when your messages have been seen.
- **Message Deletion**: Delete messages with a `[deleted message]` placeholder.
- **Date Grouping**: Chats grouped by day with date labels.
- **Responsive UI**: Optimized for desktop and mobile screens.
- **Sidebar**: Recent chats list with search functionality.

---

## 🛠 Tech Stack

| Layer          | Technologies                        |
| -------------- | ----------------------------------- |
| Frontend       | React, Context API, CSS             |
| Backend        | Node.js, Express, MongoDB, Mongoose |
| Real-time      | Socket.IO                           |
| Authentication | JSON Web Tokens (JWT)               |
| Deployment     | Docker (optional), Heroku / Vercel  |

---

## 🎬 Demo

soon!

<!-- ![SlateChat Screenshot](./docs/screenshot.png) -->

---

## 🏁 Getting Started

Follow these steps to get SlateChat running locally.

### Prerequisites

- **Node.js** v18 or higher
- **MongoDB** (local instance or Atlas cluster)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/bsricharan14/chat-app.git
   cd chat-app
   ```

2. **Install dependencies**

   ```bash
   # In the backend folder
   cd backend
   npm install

   # In the frontend folder (in a new terminal tab)
   cd ../frontend
   npm install
   ```

### Environment Variables

Create a `.env` file in the `backend` and `frontend` directories with the following values:

- **backend/.env**

  ```dotenv
  MONGO_URI=mongodb://localhost:27017/chat-app
  JWT_SECRET=your_jwt_secret
  PORT=5000
  ```

- **frontend/.env**

  ```dotenv
  REACT_APP_API_URL=http://localhost:5000
  ```

### Running the Application

1. **Start the backend server**

   ```bash
   cd backend
   npm run dev
   ```

2. **Start the frontend**

   ```bash
   cd frontend
   npm start
   ```

3. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

---

## 💡 Usage

1. Register a new account or log in with existing credentials.
2. Select a contact from the sidebar or search for a user.
3. Start chatting in real time, view online status, and manage your messages.
4. Delete messages or view read receipts as needed.

---

## 📂 Folder Structure

```
slatechat/
├── backend/               # Express server, API routes, and Socket.IO setup
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── utils/
│   ├── server.js
│   └── .env
├── frontend/              # React app with Context API and CSS modules
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── styles/
│   │   └── App.js
│   └── .env
└── README.md
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new branch: `git checkout -b feature/YourFeatureName`.
3. Commit your changes: `git commit -m 'Add some feature'`.
4. Push to the branch: `git push origin feature/YourFeatureName`.
5. Open a Pull Request.

Please ensure your code follows the project’s coding conventions and includes relevant tests.

---

## 📜 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgements

- [Create React App](https://github.com/facebook/create-react-app)
- [Socket.IO](https://socket.io/)
- [MongoDB](https://www.mongodb.com/)
- [Express](https://expressjs.com/)
- [Mongoose](https://mongoosejs.com/)

---

_Happy coding!_
