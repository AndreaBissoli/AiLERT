require('dotenv').config();
const mongoose = require("mongoose");
const User = require("../app/models/user");

async function cleanupTestUsers() {
    try {
        console.log("Connection string:", process.env.MONGODB_URI);
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connesso al database...");

        const result = await User.deleteMany({
            $or: [
                { email: { $regex: /^sorvegliante\.test\d+@comune\.it$/ } },
                { email: { $regex: /^dipendente\.test\d+@comune\.it$/ } },
                { email: { $regex: /^testdipendente\d+@comune\.it$/ } },
                { email: { $regex: /^testsorvegliante\d+@comune\.it$/ } },
                { email: { $regex: /^testchangepass\d+@comune\.it$/ } },
                { email: { $regex: /^utente\.eliminazione\d+@comune\.it$/ } },
                { email: { $regex: /^sorvegliante\.modifica\d+@comune\.it$/ } },
                { email: { $regex: /^testuser\d+@comune\.it$/ } },
                { email: 'sorvegliante.test@comune.it' },
                { email: 'utente.da.eliminare@comune.it' }
            ]
        });

        console.log(`Eliminati ${result.deletedCount} utenti di test`);
        
        const remainingUsers = await User.find({}, 'email name role');
        console.log(`\nUtenti rimanenti (${remainingUsers.length}):`);
        remainingUsers.forEach(user => {
            console.log(`- ${user.email} (${user.role})`);
        });

    } catch (error) {
        console.error("Errore:", error);
    } finally {
        await mongoose.connection.close();
        console.log("\nConnessione chiusa");
    }
}

cleanupTestUsers();