const express = require("express");
const passport = require('passport');
const db = require("../data/db");
const router = express.Router();


router.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {
        const user = req.user;
        if (user && user.displayName) {
            req.session.regName = user.displayName;
        }
        const redirectTo = req.session.redirectTo || '/';
        delete req.session.redirectTo;
        res.redirect(redirectTo);
    });

router.get("/check-auth", (req, res) => {
    if (req.isAuthenticated()) {
        res.json({ authenticated: true });
    } else {
        res.json({ authenticated: false });
    }
});

router.get("/register", (req, res) => {
    res.render("register");
});

router.post('/register', (req, res) => {
    const { reg_name, reg_surname, reg_email, reg_password, reg_country, reg_city } = req.body;
    const newUser = {
        reg_name,
        reg_surname,
        reg_email,
        reg_password,
        reg_country,
        reg_city
    };

    db.query('INSERT INTO register SET ?', newUser, (err, result) => {
        if (err) {
            console.error('Error registering user:', err);
            return res.status(500).json({ error: 'Error registering user' });
        }

        console.log('New user added:', result);
        res.redirect('/login');
    });
});

router.get("/login", (req, res) => {
    if (req.isAuthenticated()) {
        res.redirect("/");
    } else {
        res.render("login");
    }
});

router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const [user] = await db.execute("SELECT * FROM register WHERE reg_email = ? AND reg_password = ?", [email, password]);

        if (user.length > 0) {
            const regName = user[0].reg_name;
            const regSurname = user[0].reg_surname;
            const userName = regName + ' ' + regSurname;
            req.session.regName = regName;
            res.redirect('/');
        } else {
            res.status(401).send("Geçersiz e-posta veya şifre");
        }
    } catch (err) {
        console.log(err);
        res.status(500).send("Sunucu Hatası");
    }
});

router.get('/check-session', (req, res) => {
    if (req.session && req.session.regName) {
        res.json({
            isLoggedIn: true,
            user: {
                name: req.session.regName
            }
        });
    } else {
        res.json({
            isLoggedIn: false
        });
    }
});

router.use("/products/:id", async (req, res) => {
    try {
        const [product] = await db.execute("SELECT * FROM movies WHERE movie_id=?", [req.params.id]);
        console.log("Movie URL: ", product[0].movie_image);
        res.render("product-details", {
            urun: product[0]
        });
    } catch (err) {
        console.log(err);
        res.status(500).send("Sunucu Hatasi");
    }
});

router.use("/products", async (req, res) => {
    try {
        const [products] = await db.execute("SELECT * FROM movies");
        products.forEach(product => console.log("Movie URL: ", product.movie_image));
        res.render("products", {
            urunler: products
        });
    } catch (err) {
        console.log(err);
        res.status(500).send("Sunucu Hatasi");
    }
});

router.get("/search", async (req, res) => {
    const query = req.query.query || "";
    const category = req.query.category || "All";

    try {
        let results = [];

        if (category === "Titles") {
            const [products] = await db.execute("SELECT movie_id, movie_name, movie_year, movie_actors, movie_image FROM movies WHERE movie_name LIKE ?", [`%${query}%`]);
            products.forEach(product => console.log("Movie: ", product.movie_image));
            results = products.map(product => ({ ...product, type: 'product' }));
        } else if (category === "Celebs") {
            const [people] = await db.execute("SELECT people_id, people_name, people_aka, people_image FROM people WHERE people_name LIKE ? OR people_aka LIKE ?", [`%${query}%`, `%${query}%`]);
            people.forEach(person => console.log("People: ", person.people_image));
            results = people.map(person => ({ ...person, type: 'person' }));
        } else if (category === "Summaries") {
            const [products] = await db.execute("SELECT movie_id, movie_name, movie_description FROM movies WHERE movie_description LIKE ?", [`%${query}%`]);
            products.forEach(product => console.log("Movie: ", product.movie_image));
            results = products.map(product => ({ ...product, type: 'product' }));
        } else if (category === "All") {
            const [products] = await db.execute("SELECT movie_id, movie_name, movie_year, movie_actors, movie_image FROM movies WHERE movie_name LIKE ?", [`%${query}%`]);
            const [people] = await db.execute("SELECT people_id, people_name, people_aka, people_image FROM people WHERE people_name LIKE ? OR people_aka LIKE ?", [`%${query}%`, `%${query}%`]);
            products.forEach(product => console.log("Movie: ", product.movie_image));
            people.forEach(person => console.log("People: ", person.people_image));
            results = [
                ...products.map(product => ({ ...product, type: 'product' })),
                ...people.map(person => ({ ...person, type: 'person' }))
            ];
        }

        res.render("search-results", {
            results: results,
            category: category,
            query: query
        });
    } catch (err) {
        console.log(err);
        res.status(500).send("Sunucu Hatasi");
    }
});

 
router.get("/autocomplete", async function(req, res) {
    const query = req.query.query || "";
    const category = req.query.category || "All"; 
    if (query.length < 3) {
        return res.json([]);
    }

    try {
        let products = [];
        let people = [];

        if (category === "All" || category === "Titles" || category === "Summaries") {
            [products] = await db.execute("SELECT movie_id, movie_name, movie_image, movie_year FROM movies WHERE movie_name LIKE ?", [`%${query}%`]);
        }
        if (category === "All" || category === "Celebs") {
            [people] = await db.execute("SELECT people_id, people_name, people_image, people_aka FROM people WHERE people_name LIKE ? OR people_aka LIKE ?", [`%${query}%`, `%${query}%`]);
        }

        const suggestions = [
            ...products.map(product => ({
                name: product.movie_name,
                actor: product.movie_actors,
                url: `/products/${product.movie_id}`,
                image: `${product.movie_image}`,
                year: product.movie_year,
                category: 'Movie'
            })),
            ...people.map(person => ({
                name: person.people_name,
                title: person.people_aka,
                image: `${person.people_image}`,
                category: 'Person'
            }))
        ].slice(0, 10);

        res.json(suggestions);
    } catch (err) {
        console.log(err);
        res.status(500).send("Server error");
    }
});



router.use("/", async (req, res) => {
    try {
        const [products] = await db.execute("SELECT * FROM movies Order By movie_id ASC LIMIT 10 ");
        const topTenProducts = products.slice(0, 10);
        products.forEach(product => console.log("Movie: ", product.movie_image));
        const language = req.cookies.language || 'en';
        res.render("index", {
            urunler: topTenProducts,
            language: language

        });
    } catch (err) {
        console.log(err);
        res.status(500).send("Sunucu Hatasi");
    }
});

module.exports = router;
