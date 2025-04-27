require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Store adopted pets in memory (you might want to use a database in production)
let adoptedPets = [];

// Session middleware setup
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// Parse JSON bodies
app.use(express.json());

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Authentication middleware - must come before static files
app.use((req, res, next) => {
    // Allow access to login page and API routes
    if (req.path === '/login.html' || req.path === '/login' || req.path.startsWith('/api/')) {
        next();
    } else if (!req.session.isAuthenticated) {
        res.redirect('/login.html');
    } else {
        next();
    }
});

// Serve static files
app.use(express.static(__dirname));

// Handle login form submission
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    if (email && password) {
        req.session.isAuthenticated = true;
        res.redirect('/index.html');
    } else {
        res.redirect('/login.html');
    }
});

// Get adopted pets
app.get('/api/adopted-pets', (req, res) => {
    if (!req.session.isAuthenticated) {
        return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    res.json(adoptedPets);
});

// Add pet to adopted pets
app.post('/api/adopt-pet', (req, res) => {
    if (!req.session.isAuthenticated) {
        return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    const pet = req.body;
    if (!adoptedPets.some(p => p.id === pet.id)) {
        adoptedPets.push(pet);
        res.json({ success: true, message: 'Pet adopted successfully' });
    } else {
        res.status(400).json({ success: false, message: 'Pet already adopted' });
    }
});

// Remove pet from adopted pets
app.delete('/api/adopted-pets/:id', (req, res) => {
    if (!req.session.isAuthenticated) {
        return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    try {
        const petId = req.params.id;
        const initialLength = adoptedPets.length;
        adoptedPets = adoptedPets.filter(pet => pet.id !== petId);
        
        if (adoptedPets.length < initialLength) {
            res.json({ success: true, message: 'Pet removed from adopted list' });
        } else {
            res.status(404).json({ success: false, message: 'Pet not found in adopted list' });
        }
    } catch (error) {
        console.error('Error removing pet:', error);
        res.status(500).json({ success: false, message: 'Error removing pet from adopted list' });
    }
});

// Logout route
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login.html');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
    console.log('The login page should be visible at http://localhost:3000');
}); 